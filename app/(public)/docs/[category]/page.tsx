"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getCategoryBySlug, docsCategories } from "@/lib/docs-data";

export default function DocsCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const CategoryIcon = category.icon;

  // Get adjacent categories for navigation
  const currentIndex = docsCategories.findIndex((c) => c.slug === categorySlug);
  const prevCategory = currentIndex > 0 ? docsCategories[currentIndex - 1] : null;
  const nextCategory =
    currentIndex < docsCategories.length - 1
      ? docsCategories[currentIndex + 1]
      : null;

  return (
    <>
      <PageHeader
        title={category.title}
        subtitle={category.description}
        badge="Documentation"
      >
        <Flex justify="center" mt="4">
          <Box
            p="4"
            style={{
              background: `var(--${category.color}-a3)`,
              borderRadius: 16,
            }}
          >
            <CategoryIcon
              size={32}
              style={{ color: `var(--${category.color}-9)` }}
            />
          </Box>
        </Flex>
      </PageHeader>

      <Container size="3" py="9">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Flex align="center" gap="2" mb="6">
            <Link
              href="/docs"
              style={{
                textDecoration: "none",
                color: "var(--gray-11)",
                fontSize: 14,
              }}
            >
              Documentation
            </Link>
            <ChevronRight size={14} style={{ color: "var(--gray-8)" }} />
            <Text size="2" style={{ color: `var(--${category.color}-9)` }}>
              {category.title}
            </Text>
          </Flex>
        </motion.div>

        {/* Articles list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flex align="center" gap="2" mb="5">
            <BookOpen size={20} style={{ color: "var(--gray-10)" }} />
            <Heading size="5">
              {category.articles.length} articles dans cette catégorie
            </Heading>
          </Flex>

          <Flex direction="column" gap="3">
            {category.articles.map((article, index) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
              >
                <Link
                  href={`/docs/${categorySlug}/${article.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    p="5"
                    style={{
                      background: "var(--gray-a2)",
                      borderRadius: 16,
                      border: "1px solid var(--gray-a4)",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `var(--${category.color}-a6)`;
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--gray-a4)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Box style={{ flex: 1 }}>
                        <Heading size="4" mb="1">
                          {article.title}
                        </Heading>
                        <Text size="2" color="gray">
                          {article.description}
                        </Text>
                      </Box>
                      <Flex align="center" gap="4">
                        <Flex align="center" gap="1">
                          <Clock
                            size={14}
                            style={{ color: "var(--gray-10)" }}
                          />
                          <Text size="1" color="gray">
                            {article.readTime}
                          </Text>
                        </Flex>
                        <ChevronRight
                          size={20}
                          style={{ color: `var(--${category.color}-9)` }}
                        />
                      </Flex>
                    </Flex>
                  </Box>
                </Link>
              </motion.div>
            ))}
          </Flex>
        </motion.div>

        {/* Category navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Grid columns={{ initial: "1", sm: "2" }} gap="4" mt="9">
            {prevCategory && (
              <Link
                href={`/docs/${prevCategory.slug}`}
                style={{ textDecoration: "none" }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${prevCategory.color}-a6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" gap="3">
                    <ChevronLeft
                      size={20}
                      style={{ color: "var(--gray-10)" }}
                    />
                    <Box>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        Précédent
                      </Text>
                      <Text size="3" weight="medium">
                        {prevCategory.title}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Link>
            )}
            {nextCategory && (
              <Link
                href={`/docs/${nextCategory.slug}`}
                style={{
                  textDecoration: "none",
                  gridColumn: prevCategory ? "auto" : "2",
                }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${nextCategory.color}-a6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" justify="end" gap="3">
                    <Box style={{ textAlign: "right" }}>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        Suivant
                      </Text>
                      <Text size="3" weight="medium">
                        {nextCategory.title}
                      </Text>
                    </Box>
                    <ChevronRight
                      size={20}
                      style={{ color: "var(--gray-10)" }}
                    />
                  </Flex>
                </Box>
              </Link>
            )}
          </Grid>
        </motion.div>

        {/* Back to docs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Flex justify="center" mt="8">
            <Link
              href="/docs"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 9999,
                background: "var(--gray-a3)",
                color: "var(--gray-11)",
                fontSize: 14,
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gray-a4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gray-a3)";
              }}
            >
              <ChevronLeft size={16} />
              Retour à la documentation
            </Link>
          </Flex>
        </motion.div>
      </Container>
    </>
  );
}
