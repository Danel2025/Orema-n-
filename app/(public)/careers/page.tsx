"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Separator,
  Badge,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Briefcase,
  MapPin,
  Clock,
  Users,
  Heart,
  Zap,
  Globe,
  Coffee,
  GraduationCap,
  Plane,
  Gift,
  ChevronRight,
  Sparkles,
  Code,
  Headphones,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Heart,
    title: "Assurance santé",
    description: "Couverture santé complète pour vous et votre famille",
  },
  {
    icon: Coffee,
    title: "Environnement flexible",
    description: "Télétravail partiel et horaires flexibles",
  },
  {
    icon: GraduationCap,
    title: "Formation continue",
    description: "Budget formation annuel et accès à des ressources premium",
  },
  {
    icon: Plane,
    title: "Congés généreux",
    description: "25 jours de congés payés + jours fériés gabonais",
  },
  {
    icon: Gift,
    title: "Équipement",
    description: "MacBook Pro, écran 4K et budget home office",
  },
  {
    icon: Zap,
    title: "Impact réel",
    description: "Votre travail transforme le commerce africain",
  },
];

const positions = [
  {
    id: 1,
    title: "Développeur Full-Stack Senior",
    department: "Technique",
    location: "Libreville / Remote",
    type: "CDI",
    icon: Code,
    description:
      "Rejoignez notre équipe technique pour construire la prochaine génération de notre plateforme POS.",
    requirements: [
      "5+ ans d'expérience en développement web",
      "Maîtrise de React, Next.js et TypeScript",
      "Expérience avec PostgreSQL et Prisma",
      "Bonus : expérience mobile (React Native)",
    ],
    urgent: true,
  },
  {
    id: 2,
    title: "Customer Success Manager",
    department: "Support",
    location: "Libreville",
    type: "CDI",
    icon: Headphones,
    description:
      "Accompagnez nos clients dans leur réussite et assurez leur satisfaction au quotidien.",
    requirements: [
      "3+ ans en relation client B2B",
      "Excellent relationnel et sens du service",
      "Connaissance du secteur CHR appréciée",
      "Maîtrise du français, anglais apprécié",
    ],
    urgent: false,
  },
  {
    id: 3,
    title: "Business Developer",
    department: "Commercial",
    location: "Libreville",
    type: "CDI",
    icon: TrendingUp,
    description:
      "Développez notre portefeuille client et participez à notre croissance sur le marché gabonais.",
    requirements: [
      "3+ ans en vente B2B",
      "Expérience secteur tech ou retail",
      "Réseau professionnel au Gabon",
      "Permis de conduire",
    ],
    urgent: true,
  },
  {
    id: 4,
    title: "Marketing Digital Manager",
    department: "Marketing",
    location: "Libreville / Remote",
    type: "CDI",
    icon: Megaphone,
    description:
      "Pilotez notre stratégie marketing digitale et développez notre notoriété en Afrique centrale.",
    requirements: [
      "4+ ans en marketing digital",
      "Expertise SEO, SEA, Social Media",
      "Créativité et autonomie",
      "Connaissance du marché africain",
    ],
    urgent: false,
  },
];

const values = [
  {
    icon: Sparkles,
    title: "Innovation",
    description: "Nous repoussons les limites pour créer des solutions uniques",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Ensemble, nous allons plus loin. L'entraide est notre force",
  },
  {
    icon: Globe,
    title: "Impact",
    description: "Chaque jour, nous transformons le commerce africain",
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        title="Rejoignez l'équipe Oréma N+"
        subtitle="Construisez avec nous le futur du commerce en Afrique. Nous recherchons des talents passionnés."
        badge="Carrières"
      >
        <Flex gap="4" justify="center" wrap="wrap" mt="6">
          <Flex
            align="center"
            gap="2"
            px="4"
            py="2"
            style={{
              background: "var(--green-a3)",
              borderRadius: 9999,
              border: "1px solid var(--green-a5)",
            }}
          >
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--green-9)",
              }}
            />
            <Text size="2" style={{ color: "var(--green-11)" }}>
              {positions.length} postes ouverts
            </Text>
          </Flex>
          <Flex
            align="center"
            gap="2"
            px="4"
            py="2"
            style={{
              background: "var(--gray-a3)",
              borderRadius: 9999,
            }}
          >
            <MapPin size={14} style={{ color: "var(--gray-10)" }} />
            <Text size="2" color="gray">
              Libreville, Gabon
            </Text>
          </Flex>
        </Flex>
      </PageHeader>

      <Container size="4" py="9">
        {/* Culture section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Box
            mb="9"
            p="8"
            style={{
              background:
                "linear-gradient(135deg, var(--orange-a2) 0%, var(--amber-a2) 100%)",
              borderRadius: 24,
              border: "1px solid var(--orange-a4)",
            }}
          >
            <Grid columns={{ initial: "1", md: "2" }} gap="8" align="center">
              <Box>
                <Heading size="6" mb="4">
                  Pourquoi nous rejoindre ?
                </Heading>
                <Text
                  size="4"
                  style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
                >
                  Chez Oréma N+, vous ne serez pas juste un employé, mais un acteur
                  clé de la transformation digitale du commerce africain. Nous offrons
                  un environnement stimulant où vos idées comptent et où votre impact
                  est visible chaque jour.
                </Text>
                <Text
                  size="4"
                  mt="4"
                  style={{
                    color: "var(--gray-11)",
                    lineHeight: 1.8,
                    display: "block",
                  }}
                >
                  Notre équipe diverse et passionnée travaille ensemble pour résoudre
                  des défis uniques au marché africain. Si vous cherchez du sens dans
                  votre travail, vous êtes au bon endroit.
                </Text>
              </Box>
              <Grid columns="3" gap="4">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    <Box
                      p="4"
                      style={{
                        background: "var(--color-background)",
                        borderRadius: 16,
                        textAlign: "center",
                      }}
                    >
                      <Box
                        mx="auto"
                        mb="3"
                        p="3"
                        style={{
                          background: "var(--orange-a3)",
                          borderRadius: 12,
                          width: "fit-content",
                        }}
                      >
                        <value.icon
                          size={24}
                          style={{ color: "var(--orange-9)" }}
                        />
                      </Box>
                      <Text size="2" weight="bold" style={{ display: "block" }}>
                        {value.title}
                      </Text>
                    </Box>
                  </motion.div>
                ))}
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Nos avantages
            </Heading>
            <Text size="4" color="gray">
              Nous prenons soin de notre équipe
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" mb="9">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.08, duration: 0.5 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    height: "100%",
                  }}
                >
                  <Flex align="start" gap="4">
                    <Box
                      p="3"
                      style={{
                        background: "var(--orange-a3)",
                        borderRadius: 12,
                        flexShrink: 0,
                      }}
                    >
                      <benefit.icon
                        size={20}
                        style={{ color: "var(--orange-9)" }}
                      />
                    </Box>
                    <Box>
                      <Text size="3" weight="bold" mb="1" style={{ display: "block" }}>
                        {benefit.title}
                      </Text>
                      <Text size="2" color="gray">
                        {benefit.description}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Open positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Postes ouverts
            </Heading>
            <Text size="4" color="gray">
              Trouvez votre prochaine aventure professionnelle
            </Text>
          </Box>

          <Flex direction="column" gap="4" mb="9">
            {positions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              >
                <Box
                  p="6"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: position.urgent
                      ? "1px solid var(--orange-a6)"
                      : "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px -8px var(--gray-a6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Grid columns={{ initial: "1", md: "4" }} gap="4" align="center">
                    <Flex gap="4" align="start" style={{ gridColumn: "span 2" }}>
                      <Box
                        p="3"
                        style={{
                          background: position.urgent
                            ? "var(--orange-a3)"
                            : "var(--gray-a3)",
                          borderRadius: 12,
                          flexShrink: 0,
                        }}
                      >
                        <position.icon
                          size={24}
                          style={{
                            color: position.urgent
                              ? "var(--orange-9)"
                              : "var(--gray-11)",
                          }}
                        />
                      </Box>
                      <Box>
                        <Flex align="center" gap="2" mb="1">
                          <Heading size="4">{position.title}</Heading>
                          {position.urgent && (
                            <Badge color="orange" size="1">
                              Urgent
                            </Badge>
                          )}
                        </Flex>
                        <Flex gap="3" wrap="wrap">
                          <Flex align="center" gap="1">
                            <Briefcase
                              size={12}
                              style={{ color: "var(--gray-10)" }}
                            />
                            <Text size="1" color="gray">
                              {position.department}
                            </Text>
                          </Flex>
                          <Flex align="center" gap="1">
                            <MapPin
                              size={12}
                              style={{ color: "var(--gray-10)" }}
                            />
                            <Text size="1" color="gray">
                              {position.location}
                            </Text>
                          </Flex>
                          <Flex align="center" gap="1">
                            <Clock
                              size={12}
                              style={{ color: "var(--gray-10)" }}
                            />
                            <Text size="1" color="gray">
                              {position.type}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    </Flex>

                    <Box>
                      <Text size="2" color="gray">
                        {position.description}
                      </Text>
                    </Box>

                    <Flex justify="end">
                      <Link
                        href={`mailto:careers@orema-nplus.ga?subject=Candidature : ${position.title}`}
                        style={{
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 20px",
                          borderRadius: 9999,
                          background:
                            "linear-gradient(135deg, var(--orange-9) 0%, var(--amber-9) 100%)",
                          color: "white",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Postuler
                        <ChevronRight size={16} />
                      </Link>
                    </Flex>
                  </Grid>
                </Box>
              </motion.div>
            ))}
          </Flex>
        </motion.div>

        {/* Spontaneous application */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 24,
              border: "1px solid var(--gray-a4)",
              textAlign: "center",
            }}
          >
            <Users
              size={48}
              style={{ color: "var(--gray-10)", marginBottom: 16 }}
            />
            <Heading size="5" mb="3">
              Vous ne trouvez pas votre poste idéal ?
            </Heading>
            <Text
              size="3"
              color="gray"
              mb="6"
              style={{ maxWidth: 500, margin: "0 auto", display: "block" }}
            >
              Envoyez-nous une candidature spontanée. Nous sommes toujours à la
              recherche de talents exceptionnels pour rejoindre notre aventure.
            </Text>
            <Link
              href="mailto:careers@orema-nplus.ga?subject=Candidature spontanée"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 9999,
                background: "var(--gray-12)",
                color: "var(--gray-1)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Candidature spontanée
              <ChevronRight size={16} />
            </Link>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
