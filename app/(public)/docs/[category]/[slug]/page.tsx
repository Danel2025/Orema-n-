"use client";

import type { JSX } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Separator,
  Skeleton,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  BookOpen,
  Share2,
  Printer,
  ThumbsUp,
  ThumbsDown,
  LucideIcon,
  ShoppingCart,
  Utensils,
  Package,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  HardDrive,
  Book,
  FileText,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getPublishedDocArticleBySlugs } from "@/actions/admin/documentation";
import { useState, useEffect } from "react";

// Map des icônes par nom
const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Utensils,
  Package,
  Users,
  Settings,
  BarChart3,
  Printer,
  CreditCard,
  HardDrive,
  Book,
  FileText,
  HelpCircle,
};

interface ArticleData {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    content: string;
    read_time: string;
  };
  category: {
    id: string;
    slug: string;
    title: string;
    color: string;
    icon: string;
  };
  relatedArticles: {
    id: string;
    slug: string;
    title: string;
    ordre: number;
  }[];
}

export default function DocsArticlePage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const articleSlug = params.slug as string;

  const [data, setData] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPublishedDocArticleBySlugs(categorySlug, articleSlug);
        if (!result) {
          setData(null);
        } else {
          setData(result as ArticleData);
        }
      } catch (error) {
        console.error("Erreur chargement article:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categorySlug, articleSlug]);

  if (isLoading) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Container size="3" py="9" style={{ paddingTop: 120 }}>
          <Skeleton style={{ height: 24, width: 200, marginBottom: 24 }} />
          <Skeleton style={{ height: 48, width: "70%", marginBottom: 16 }} />
          <Skeleton style={{ height: 24, width: "50%", marginBottom: 32 }} />
          <Skeleton style={{ height: 400, borderRadius: 20 }} />
        </Container>
      </Box>
    );
  }

  if (!data) {
    notFound();
  }

  const { article, category, relatedArticles } = data;
  const CategoryIcon = iconMap[category.icon] || Book;

  // Get adjacent articles for navigation
  const currentIndex = relatedArticles.findIndex((a) => a.slug === articleSlug);
  const prevArticle = currentIndex > 0 ? relatedArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex < relatedArticles.length - 1
      ? relatedArticles[currentIndex + 1]
      : null;

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split("\n");
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <Box
              key={`code-${index}`}
              my="4"
              p="4"
              style={{
                background: "var(--gray-a3)",
                borderRadius: 12,
                overflow: "auto",
                fontFamily: "var(--font-google-sans-code), monospace",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <pre style={{ margin: 0 }}>
                <code>{codeContent.join("\n")}</code>
              </pre>
            </Box>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith("## ")) {
        elements.push(
          <Heading key={index} size="5" mt="6" mb="3">
            {line.slice(3)}
          </Heading>
        );
        return;
      }
      if (line.startsWith("### ")) {
        elements.push(
          <Heading key={index} size="4" mt="5" mb="2">
            {line.slice(4)}
          </Heading>
        );
        return;
      }
      if (line.startsWith("#### ")) {
        elements.push(
          <Heading key={index} size="3" mt="4" mb="2">
            {line.slice(5)}
          </Heading>
        );
        return;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        elements.push(
          <Box
            key={index}
            my="4"
            p="4"
            style={{
              background: "var(--amber-a2)",
              borderLeft: "4px solid var(--amber-9)",
              borderRadius: "0 8px 8px 0",
            }}
          >
            <Text size="3" style={{ color: "var(--amber-11)" }}>
              {line.slice(2)}
            </Text>
          </Box>
        );
        return;
      }

      // List items
      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <Flex key={index} gap="2" my="1" ml="4">
            <Text style={{ color: "var(--gray-10)" }}>•</Text>
            <Text size="3" style={{ color: "var(--gray-11)", lineHeight: 1.7 }}>
              {renderInlineFormatting(line.slice(2))}
            </Text>
          </Flex>
        );
        return;
      }

      // Table (simple detection)
      if (line.startsWith("|") && line.endsWith("|")) {
        elements.push(
          <Text
            key={index}
            size="2"
            style={{
              fontFamily: "var(--font-google-sans-code), monospace",
              color: "var(--gray-11)",
              display: "block",
              whiteSpace: "pre",
            }}
          >
            {line}
          </Text>
        );
        return;
      }

      // Empty line
      if (line.trim() === "") {
        elements.push(<Box key={index} style={{ height: 12 }} />);
        return;
      }

      // Regular paragraph
      elements.push(
        <Text
          key={index}
          size="3"
          style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
        >
          {renderInlineFormatting(line)}
        </Text>
      );
    });

    return elements;
  };

  // Render inline formatting (bold, code, links)
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} style={{ fontWeight: 600, color: "var(--gray-12)" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Inline code
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((codePart, j) => {
        if (codePart.startsWith("`") && codePart.endsWith("`")) {
          return (
            <code
              key={`${i}-${j}`}
              style={{
                background: "var(--gray-a4)",
                padding: "2px 6px",
                borderRadius: 4,
                fontFamily: "var(--font-google-sans-code), monospace",
                fontSize: "0.9em",
              }}
            >
              {codePart.slice(1, -1)}
            </code>
          );
        }
        return codePart;
      });
    });
  };

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      <Container size="3" py="9" style={{ paddingTop: 120 }}>
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Flex align="center" gap="2" mb="6" wrap="wrap">
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
            <Link
              href={`/docs/${categorySlug}`}
              style={{
                textDecoration: "none",
                color: "var(--gray-11)",
                fontSize: 14,
              }}
            >
              {category.title}
            </Link>
            <ChevronRight size={14} style={{ color: "var(--gray-8)" }} />
            <Text size="2" style={{ color: `var(--${category.color}-9)` }}>
              {article.title}
            </Text>
          </Flex>
        </motion.div>

        {/* Article header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flex align="center" gap="3" mb="4">
            <Box
              p="3"
              style={{
                background: `var(--${category.color}-a3)`,
                borderRadius: 12,
              }}
            >
              <CategoryIcon
                size={24}
                style={{ color: `var(--${category.color}-9)` }}
              />
            </Box>
            <Box>
              <Text size="1" color="gray">
                {category.title}
              </Text>
              <Flex align="center" gap="2">
                <Clock size={12} style={{ color: "var(--gray-10)" }} />
                <Text size="1" color="gray">
                  {article.read_time} de lecture
                </Text>
              </Flex>
            </Box>
          </Flex>

          <Heading size="8" mb="3">
            {article.title}
          </Heading>
          <Text size="4" color="gray" mb="6" style={{ display: "block" }}>
            {article.description}
          </Text>

          {/* Actions */}
          <Flex gap="2" mb="8">
            <button
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--gray-a5)",
                background: "transparent",
                color: "var(--gray-11)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Printer size={14} />
              Imprimer
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--gray-a5)",
                background: "transparent",
                color: "var(--gray-11)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Share2 size={14} />
              Partager
            </button>
          </Flex>
        </motion.div>

        {/* Article content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Box
            p={{ initial: "5", sm: "8" }}
            style={{
              background: "var(--color-background)",
              borderRadius: 20,
              border: "1px solid var(--gray-a4)",
            }}
          >
            {renderContent(article.content)}
          </Box>
        </motion.div>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Box
            mt="8"
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <Text size="3" weight="medium" mb="4" style={{ display: "block" }}>
              Cet article vous a-t-il été utile ?
            </Text>
            <Flex gap="3" justify="center">
              <button
                onClick={() => setFeedbackGiven("up")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "none",
                  background:
                    feedbackGiven === "up"
                      ? "var(--green-9)"
                      : "var(--gray-a3)",
                  color: feedbackGiven === "up" ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ThumbsUp size={16} />
                Oui
              </button>
              <button
                onClick={() => setFeedbackGiven("down")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "none",
                  background:
                    feedbackGiven === "down"
                      ? "var(--red-9)"
                      : "var(--gray-a3)",
                  color: feedbackGiven === "down" ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ThumbsDown size={16} />
                Non
              </button>
            </Flex>
            {feedbackGiven && (
              <Text size="2" color="gray" mt="3" style={{ display: "block" }}>
                Merci pour votre retour !
              </Text>
            )}
          </Box>
        </motion.div>

        <Separator size="4" my="8" />

        {/* Article navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Grid columns={{ initial: "1", sm: "2" }} gap="4">
            {prevArticle && (
              <Link
                href={`/docs/${categorySlug}/${prevArticle.slug}`}
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
                    e.currentTarget.style.borderColor = `var(--${category.color}-a6)`;
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
                        Article précédent
                      </Text>
                      <Text size="3" weight="medium">
                        {prevArticle.title}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Link>
            )}
            {nextArticle && (
              <Link
                href={`/docs/${categorySlug}/${nextArticle.slug}`}
                style={{
                  textDecoration: "none",
                  gridColumn: prevArticle ? "auto" : "2",
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
                    e.currentTarget.style.borderColor = `var(--${category.color}-a6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" justify="end" gap="3">
                    <Box style={{ textAlign: "right" }}>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        Article suivant
                      </Text>
                      <Text size="3" weight="medium">
                        {nextArticle.title}
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

        {/* Back to category */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Flex justify="center" mt="8">
            <Link
              href={`/docs/${categorySlug}`}
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
            >
              <BookOpen size={16} />
              Tous les articles de {category.title}
            </Link>
          </Flex>
        </motion.div>
      </Container>
    </Box>
  );
}
