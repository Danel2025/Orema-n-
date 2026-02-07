"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Avatar,
  Card,
} from "@radix-ui/themes";
import { Star, Quote, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from "./motion-wrapper";

const testimonials = [
  {
    name: "Marie-Claire Obiang",
    role: "Gérante",
    company: "Maquis Chez Maman",
    location: "Libreville",
    avatar: "MC",
    content:
      "Avant Oréma N+, on perdait du temps avec les tickets papier. Maintenant tout est sur tablette et je vois mes ventes en temps réel. Le mode hors-ligne m'a sauvé pendant les coupures !",
    rating: 5,
  },
  {
    name: "Jean-Baptiste Nzé",
    role: "Propriétaire",
    company: "Fast Food Mbolo",
    location: "Port-Gentil",
    avatar: "JN",
    content:
      "L'intégration d'Airtel Money a changé notre business. 60% de nos clients paient par mobile. Plus rapide, plus sûr. L'équipe support répond toujours rapidement.",
    rating: 5,
  },
  {
    name: "Aminata Diallo",
    role: "Directrice",
    company: "Brasserie L'Étoile",
    location: "Franceville",
    avatar: "AD",
    content:
      "On a 15 tables et 3 serveurs. Avant, c'était le chaos aux heures de pointe. Avec le plan de salle et les impressions en cuisine, tout est fluide maintenant.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <Box
      id="testimonials"
      py="9"
      style={{ background: "var(--color-background)" }}
    >
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--purple-a3)",
                border: "1px solid var(--purple-a5)",
                padding: "8px 18px",
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--purple-11)" }}
              >
                Témoignages
              </Text>
            </Box>

            <Heading size="8" align="center">
              Ce que disent nos clients
            </Heading>

            <Text size="3" align="center" color="gray" className="max-w-lg">
              Des centaines de commerçants gabonais ont transformé leur activité
              avec Oréma N+.
            </Text>
          </Flex>
        </FadeIn>

        {/* Testimonials Grid */}
        <StaggerContainer staggerDelay={0.15}>
          <Grid columns={{ initial: "1", md: "3" }} gap="4" style={{ alignItems: "stretch" }}>
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index} style={{ height: "100%" }}>
                  <ScaleOnHover style={{ height: "100%" }}>
                    <Card size="3" style={{ height: "100%" }}>
                      <Flex direction="column" gap="4" style={{ height: "100%" }}>
                      {/* Quote icon */}
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Flex
                          align="center"
                          justify="center"
                          className="rounded-full"
                          style={{ width: 40, height: 40, background: "var(--orange-a3)" }}
                        >
                          <Quote size={18} style={{ color: "var(--orange-9)" }} />
                        </Flex>
                      </motion.div>

                      {/* Rating */}
                      <Flex gap="1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: false, margin: "-50px" }}
                          >
                            <Star
                              size={14}
                              fill="var(--amber-9)"
                              style={{ color: "var(--amber-9)" }}
                            />
                          </motion.div>
                        ))}
                      </Flex>

                      {/* Content */}
                      <Text
                        size="2"
                        style={{ lineHeight: 1.7, flex: 1 }}
                        color="gray"
                      >
                        &ldquo;{testimonial.content}&rdquo;
                      </Text>

                      {/* Author */}
                      <Flex gap="3" align="center" style={{ marginTop: "auto", paddingTop: 16 }}>
                        <Avatar
                          size="3"
                          radius="full"
                          fallback={testimonial.avatar}
                          style={{
                            background:
                              "linear-gradient(135deg, var(--orange-9) 0%, var(--amber-9) 100%)",
                            color: "white",
                          }}
                        />
                        <Flex direction="column" gap="0">
                          <Text size="2" weight="bold">
                            {testimonial.name}
                          </Text>
                          <Text size="1" color="gray">
                            {testimonial.role}, {testimonial.company}
                          </Text>
                          <Text size="1" color="gray">
                            {testimonial.location}
                          </Text>
                        </Flex>
                      </Flex>
                      </Flex>
                    </Card>
                  </ScaleOnHover>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>

        {/* CTA Section */}
        <FadeIn delay={0.3}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden"
            style={{
              marginTop: 32,
              padding: 32,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, var(--orange-9) 0%, var(--amber-9) 100%)",
            }}
          >
            {/* Pattern overlay */}
            <Box
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <Flex
              direction={{ initial: "column", md: "row" }}
              justify="between"
              align={{ initial: "start", md: "center" }}
              gap="6"
              className="relative z-10"
            >
              <Flex direction="column" gap="2">
                <Heading size="6" style={{ color: "white" }}>
                  Prêt à transformer votre commerce ?
                </Heading>
                <Text size="3" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Rejoignez les centaines de commerçants qui ont choisi Oréma N+.
                </Text>
              </Flex>

              <Flex gap="3" style={{ flexShrink: 0 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/register"
                    target="_blank"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "white",
                      color: "var(--orange-9)",
                      padding: "12px 20px",
                      borderRadius: 8,
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Essai gratuit
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="#contact"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "transparent",
                      color: "white",
                      padding: "12px 20px",
                      borderRadius: 8,
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: "none",
                      border: "2px solid rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Nous contacter
                  </Link>
                </motion.div>
              </Flex>
            </Flex>
          </motion.div>
        </FadeIn>
      </Container>
    </Box>
  );
}
