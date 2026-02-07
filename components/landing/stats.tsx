"use client";

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Card,
} from "@radix-ui/themes";
import { motion, useInView } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from "./motion-wrapper";

const stats = [
  {
    value: 500,
    suffix: "+",
    label: "Commerces équipés",
    description: "Au Gabon et en Afrique centrale",
  },
  {
    value: 2,
    suffix: "M+",
    label: "Transactions/mois",
    description: "Traitées sur notre plateforme",
  },
  {
    value: 15,
    suffix: " Mds",
    label: "FCFA de ventes",
    description: "Gérées par nos clients",
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Disponibilité",
    description: "Grâce au mode hors-ligne",
  },
];

function AnimatedCounter({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false });

  useEffect(() => {
    if (!isInView) {
      setDisplayValue("0");
      return;
    }

    const startTime = performance.now();
    const endValue = value;
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = endValue * easeOutQuart;

      if (value % 1 !== 0) {
        setDisplayValue(current.toFixed(1));
      } else {
        setDisplayValue(Math.floor(current).toLocaleString("fr-FR"));
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="price-fcfa">
      {displayValue}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <Box py="9" style={{ background: "var(--color-background)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--amber-a3)",
                border: "1px solid var(--amber-a5)",
                padding: "8px 18px",
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--amber-11)" }}
              >
                En chiffres
              </Text>
            </Box>

            <Heading size="8" align="center">
              La confiance de centaines de commerces
            </Heading>

            <Text size="3" align="center" color="gray" className="max-w-lg">
              Depuis 2020, Oréma N+ accompagne la transformation digitale du
              commerce en Afrique centrale.
            </Text>
          </Flex>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer staggerDelay={0.15}>
          <Grid columns={{ initial: "2", md: "4" }} gap="4">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <ScaleOnHover scale={1.05}>
                  <Card size="3" className="text-center">
                    <Flex direction="column" align="center" gap="2">
                      <Heading
                        size="8"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--orange-9) 0%, var(--amber-9) 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                        />
                      </Heading>
                      <Text size="3" weight="bold">
                        {stat.label}
                      </Text>
                      <Text size="1" color="gray">
                        {stat.description}
                      </Text>
                    </Flex>
                  </Card>
                </ScaleOnHover>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>

        {/* Client logos */}
        <FadeIn delay={0.4}>
          <Flex direction="column" align="center" gap="4" mt="8">
            <Text size="2" color="gray">
              Ils nous font confiance
            </Text>
            <Flex gap="4" align="center" wrap="wrap" justify="center">
              {[
                "Maquis du Port",
                "Brasserie L'Étoile",
                "Fast Food Mbolo",
                "Café Ogooué",
              ].map((name, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: false, margin: "-50px" }}
                >
                  <Box
                    className="rounded-lg"
                    style={{
                      background: "var(--gray-a3)",
                      border: "1px solid var(--gray-a4)",
                      padding: "10px 18px",
                    }}
                  >
                    <Text size="2" weight="medium" color="gray">
                      {name}
                    </Text>
                  </Box>
                </motion.div>
              ))}
            </Flex>
          </Flex>
        </FadeIn>
      </Container>
    </Box>
  );
}
