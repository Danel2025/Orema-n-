/**
 * Module de detection automatique d'imprimantes USB
 * Detecte les ports COM/USB disponibles sous Windows et Linux
 *
 * @module lib/print/usb-detector
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";

/**
 * Peripherique USB detecte
 */
export interface DetectedUSBDevice {
  /** Chemin du peripherique (COM3, /dev/ttyUSB0, etc.) */
  path: string;
  /** Nom du fabricant si disponible */
  manufacturer?: string;
  /** Description du peripherique */
  description?: string;
  /** Type de connexion detecte */
  type: "COM" | "ttyUSB" | "ttyACM" | "lp";
}

/**
 * Resultat du scan USB
 */
export interface USBScanResult {
  success: boolean;
  devices: DetectedUSBDevice[];
  platform: string;
  error?: string;
  duration?: number;
}

/**
 * Detecte les peripheriques USB selon la plateforme
 */
export async function detectUSBDevices(): Promise<USBScanResult> {
  const startTime = Date.now();
  const platform = process.platform;

  try {
    let devices: DetectedUSBDevice[] = [];

    if (platform === "win32") {
      devices = await detectCOMPortsWindows();
    } else if (platform === "linux") {
      devices = await detectUSBPortsLinux();
    } else if (platform === "darwin") {
      devices = await detectUSBPortsMacOS();
    } else {
      return {
        success: false,
        devices: [],
        platform,
        error: `Plateforme non supportee: ${platform}`,
      };
    }

    return {
      success: true,
      devices,
      platform,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      devices: [],
      platform,
      error: error instanceof Error ? error.message : "Erreur lors du scan USB",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Detecte les ports COM sous Windows via PowerShell
 */
async function detectCOMPortsWindows(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  try {
    // Methode 1: PowerShell simple pour lister les ports COM
    const portsOutput = execSync(
      'powershell -Command "[System.IO.Ports.SerialPort]::GetPortNames()"',
      { encoding: "utf-8", timeout: 10000, windowsHide: true }
    );

    const ports = portsOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.match(/^COM\d+$/i));

    // Pour chaque port, essayer d'obtenir plus d'infos
    for (const port of ports) {
      const device: DetectedUSBDevice = {
        path: port,
        type: "COM",
      };

      // Essayer d'obtenir la description via WMI
      try {
        const wmiOutput = execSync(
          `powershell -Command "Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -like '*${port}*' } | Select-Object -First 1 -ExpandProperty Name"`,
          { encoding: "utf-8", timeout: 5000, windowsHide: true }
        );
        const description = wmiOutput.trim();
        if (description) {
          device.description = description;
          // Extraire le fabricant du nom si possible
          const match = description.match(/^(.+?)\s+\(/);
          if (match) {
            device.manufacturer = match[1];
          }
        }
      } catch {
        // Pas grave si on n'obtient pas la description
      }

      devices.push(device);
    }
  } catch (error) {
    console.error("[USB Detection Windows] Erreur PowerShell:", error);

    // Fallback: utiliser mode.com
    try {
      const modeOutput = execSync("mode", {
        encoding: "utf-8",
        timeout: 5000,
        windowsHide: true,
      });

      const comMatches = modeOutput.match(/COM\d+/gi);
      if (comMatches) {
        const uniquePorts = [...new Set(comMatches)];
        for (const port of uniquePorts) {
          devices.push({
            path: port.toUpperCase(),
            type: "COM",
          });
        }
      }
    } catch {
      console.error("[USB Detection Windows] Fallback mode.com echoue");
    }
  }

  return devices;
}

/**
 * Detecte les peripheriques USB sous Linux
 */
async function detectUSBPortsLinux(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  // 1. Scanner /dev/ttyUSB* (adaptateurs USB-Serie comme PL2303, CH340)
  try {
    const devFiles = await fs.readdir("/dev");
    const ttyUSBDevices = devFiles
      .filter((name) => name.match(/^ttyUSB\d+$/))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyUSB",
          description: "Adaptateur USB-Serie",
        })
      );
    devices.push(...ttyUSBDevices);
  } catch {
    // /dev non lisible ou pas de ttyUSB
  }

  // 2. Scanner /dev/ttyACM* (CDC-ACM comme Arduino)
  try {
    const devFiles = await fs.readdir("/dev");
    const ttyACMDevices = devFiles
      .filter((name) => name.match(/^ttyACM\d+$/))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyACM",
          description: "Peripherique USB CDC-ACM",
        })
      );
    devices.push(...ttyACMDevices);
  } catch {
    // Pas de ttyACM
  }

  // 3. Scanner /dev/usb/lp* (imprimantes USB directes)
  try {
    const usbFiles = await fs.readdir("/dev/usb");
    const lpDevices = usbFiles
      .filter((name) => name.match(/^lp\d+$/))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/usb/${name}`,
          type: "lp",
          description: "Imprimante USB",
        })
      );
    devices.push(...lpDevices);
  } catch {
    // /dev/usb n'existe pas ou pas d'imprimantes
  }

  // 4. Enrichir avec udevadm si disponible
  for (const device of devices) {
    try {
      const udevOutput = execSync(
        `udevadm info --query=property --name=${device.path} 2>/dev/null | grep -E "ID_VENDOR=|ID_MODEL="`,
        { encoding: "utf-8", timeout: 2000 }
      );

      const vendorMatch = udevOutput.match(/ID_VENDOR=(.+)/);
      const modelMatch = udevOutput.match(/ID_MODEL=(.+)/);

      if (vendorMatch) {
        device.manufacturer = vendorMatch[1].replace(/_/g, " ");
      }
      if (modelMatch) {
        device.description = modelMatch[1].replace(/_/g, " ");
      }
    } catch {
      // udevadm non disponible ou erreur
    }
  }

  return devices;
}

/**
 * Detecte les peripheriques USB sous macOS
 */
async function detectUSBPortsMacOS(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  // Scanner /dev/cu.* (ports serie callout)
  try {
    const devFiles = await fs.readdir("/dev");
    const cuDevices = devFiles
      .filter((name) => name.match(/^cu\.(usbserial|usbmodem)/i))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyUSB",
          description: "Port serie USB",
        })
      );
    devices.push(...cuDevices);
  } catch {
    // Erreur de lecture
  }

  return devices;
}

/**
 * Verifie si un peripherique USB est accessible
 */
export async function testUSBDevice(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
