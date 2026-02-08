/**
 * API Route pour scanner le réseau et détecter les imprimantes
 *
 * Scanne les adresses IP du réseau local sur le port 9100
 * (port standard des imprimantes ESC/POS)
 */

import { NextResponse } from "next/server";
import * as os from "os";
import { getSession } from "@/lib/auth/session";

const PRINTER_PORT = 9100;
const SCAN_TIMEOUT = 500; // 500ms par IP
const MAX_PARALLEL_SCANS = 50; // Limiter les connexions parallèles

interface ScanResult {
  success: boolean;
  printers?: string[];
  error?: string;
  scannedCount?: number;
  duration?: number;
}

export async function POST(): Promise<NextResponse<ScanResult>> {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    // Network scan is restricted to ADMIN, MANAGER, and SUPER_ADMIN roles
    const allowedRoles = ["ADMIN", "MANAGER", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: "Acces non autorise" }, { status: 403 });
    }

    // Obtenir les interfaces réseau
    const networkInfo = getLocalNetworkInfo();

    if (!networkInfo) {
      return NextResponse.json({
        success: false,
        error: "Impossible de détecter le réseau local",
      });
    }

    const { baseIP, startRange, endRange } = networkInfo;

    // Générer les IPs à scanner
    const ipsToScan: string[] = [];
    for (let i = startRange; i <= endRange; i++) {
      ipsToScan.push(`${baseIP}.${i}`);
    }

    // Scanner les IPs en parallèle (par lots)
    const foundPrinters: string[] = [];
    let scannedCount = 0;

    for (let i = 0; i < ipsToScan.length; i += MAX_PARALLEL_SCANS) {
      const batch = ipsToScan.slice(i, i + MAX_PARALLEL_SCANS);
      const results = await Promise.all(
        batch.map(async (ip) => {
          const isOpen = await testPort(ip, PRINTER_PORT, SCAN_TIMEOUT);
          scannedCount++;
          return { ip, isOpen };
        })
      );

      for (const result of results) {
        if (result.isOpen) {
          foundPrinters.push(result.ip);
        }
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      printers: foundPrinters,
      scannedCount,
      duration,
    });
  } catch (error) {
    console.error("[API Scan] Erreur:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du scan",
    }, { status: 500 });
  }
}

/**
 * Obtenir les informations du réseau local
 */
function getLocalNetworkInfo(): { baseIP: string; startRange: number; endRange: number } | null {
  const interfaces = os.networkInterfaces();

  for (const [, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    for (const addr of addresses) {
      // Ignorer les adresses IPv6 et loopback
      if (addr.family === "IPv4" && !addr.internal) {
        const ip = addr.address;
        const netmask = addr.netmask;

        // Pour un masque /24 typique (255.255.255.0)
        if (netmask === "255.255.255.0") {
          const parts = ip.split(".");
          const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;

          return {
            baseIP,
            startRange: 1,
            endRange: 254,
          };
        }

        // Pour d'autres masques, utiliser une plage réduite
        const parts = ip.split(".");
        const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;
        const currentOctet = parseInt(parts[3], 10);

        return {
          baseIP,
          startRange: Math.max(1, currentOctet - 50),
          endRange: Math.min(254, currentOctet + 50),
        };
      }
    }
  }

  return null;
}

/**
 * Tester si un port est ouvert sur une IP
 */
async function testPort(ip: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Import dynamique pour éviter les erreurs côté client
    import("net").then((net) => {
      const socket = new net.Socket();

      const timeoutId = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.connect(port, ip, () => {
        clearTimeout(timeoutId);
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        clearTimeout(timeoutId);
        socket.destroy();
        resolve(false);
      });
    }).catch(() => {
      resolve(false);
    });
  });
}
