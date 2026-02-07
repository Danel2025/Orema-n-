"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Badge,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader, Newsletter } from "@/components/public";
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag,
  LucideIcon,
  // Icons pour les posts
  Globe,
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getPublishedBlogPosts,
  getFeaturedBlogPost,
  getPublishedBlogCategories,
} from "@/actions/admin/blog";

// Map des icônes par nom
const iconMap: Record<string, LucideIcon> = {
  Globe,
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
  BookOpen,
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  icon: string | null;
  color: string | null;
  featured: boolean;
  published_at: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    color: string;
  } | null;
  author: {
    id: string;
    name: string;
    role: string | null;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  color: string;
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [postsData, featured, cats] = await Promise.all([
          getPublishedBlogPosts(),
          getFeaturedBlogPost(),
          getPublishedBlogCategories(),
        ]);
        setPosts(postsData as BlogPost[]);
        setFeaturedPost(featured as BlogPost | null);
        setCategories(cats as BlogCategory[]);
      } catch (error) {
        console.error("Erreur chargement blog:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const allCategories = [
    { id: "all", slug: "all", name: "Tous les articles", color: "gray" },
    ...categories,
  ];

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "all") return !post.featured;
    return post.category?.id === activeCategory && !post.featured;
  });

  const displayedPosts = filteredPosts.slice(0, visiblePosts);
  const hasMorePosts = filteredPosts.length > visiblePosts;

  const loadMorePosts = () => {
    setVisiblePosts((prev) => prev + 6);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <PageHeader
        title="Blog Oréma N+"
        subtitle="Actualités, conseils et bonnes pratiques pour optimiser votre commerce."
        badge="Blog"
      />

      <Container size="4" py="9">
        {/* Featured post */}
        {featuredPost && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: "none" }}>
              <Box
                mb="9"
                style={{
                  background:
                    "linear-gradient(135deg, var(--orange-a2) 0%, var(--amber-a2) 100%)",
                  borderRadius: 24,
                  border: "1px solid var(--orange-a4)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px -12px var(--orange-a5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Grid columns={{ initial: "1", md: "5" }}>
                  <Box
                    style={{
                      gridColumn: "span 2",
                      minHeight: 200,
                      background: `var(--${featuredPost.color || "orange"}-a3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(() => {
                      const FeaturedIcon = iconMap[featuredPost.icon || ""] || Globe;
                      return (
                        <FeaturedIcon
                          size={64}
                          style={{ color: `var(--${featuredPost.color || "orange"}-9)`, opacity: 0.5 }}
                        />
                      );
                    })()}
                  </Box>
                  <Box p="8" style={{ gridColumn: "span 3" }}>
                    <Flex gap="2" mb="4" wrap="wrap">
                      <Badge color="orange" size="2">
                        Article vedette
                      </Badge>
                      {featuredPost.tags.map((tag) => (
                        <Badge key={tag.id} variant="surface" size="1">
                          {tag.name}
                        </Badge>
                      ))}
                    </Flex>
                    <Heading size="6" mb="3" style={{ color: "var(--gray-12)" }}>
                      {featuredPost.title}
                    </Heading>
                    <Text
                      size="3"
                      mb="5"
                      style={{
                        color: "var(--gray-11)",
                        lineHeight: 1.7,
                        display: "block",
                      }}
                    >
                      {featuredPost.excerpt}
                    </Text>
                    <Flex
                      align="center"
                      justify="between"
                      wrap="wrap"
                      gap="4"
                    >
                      <Flex align="center" gap="4">
                        <Flex align="center" gap="2">
                          <User size={14} style={{ color: "var(--gray-10)" }} />
                          <Text size="2" color="gray">
                            {featuredPost.author?.name}
                          </Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <Calendar
                            size={14}
                            style={{ color: "var(--gray-10)" }}
                          />
                          <Text size="2" color="gray">
                            {formatDate(featuredPost.published_at)}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex
                        align="center"
                        gap="2"
                        style={{ color: "var(--orange-9)" }}
                      >
                        <Text size="2" weight="bold">
                          Lire l&apos;article
                        </Text>
                        <ArrowRight size={16} />
                      </Flex>
                    </Flex>
                  </Box>
                </Grid>
              </Box>
            </Link>
          </motion.div>
        )}

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Flex gap="2" wrap="wrap" mb="8">
            {allCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                onClick={() => {
                  setActiveCategory(category.id);
                  setVisiblePosts(6);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 9999,
                  border: "none",
                  background:
                    activeCategory === category.id
                      ? "linear-gradient(135deg, var(--orange-9) 0%, var(--amber-9) 100%)"
                      : "var(--gray-a3)",
                  color:
                    activeCategory === category.id ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {category.name}
              </motion.button>
            ))}
          </Flex>
        </motion.div>

        {/* Loading state */}
        {isLoading ? (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="5">
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 20,
                  height: 320,
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </Grid>
        ) : (
          <>
            {/* Posts grid */}
            <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="5">
              {displayedPosts.map((post, index) => {
                const PostIcon = iconMap[post.icon || ""] || BookOpen;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.08, duration: 0.5 }}
                  >
                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                      <Box
                        style={{
                          background: "var(--gray-a2)",
                          borderRadius: 20,
                          border: "1px solid var(--gray-a4)",
                          overflow: "hidden",
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 24px -8px var(--gray-a5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Icon header */}
                        <Box
                          style={{
                            height: 100,
                            background: `var(--${post.color || "gray"}-a2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            p="4"
                            style={{
                              background: `var(--${post.color || "gray"}-a3)`,
                              borderRadius: 16,
                            }}
                          >
                            <PostIcon
                              size={32}
                              style={{ color: `var(--${post.color || "gray"}-9)` }}
                            />
                          </Box>
                        </Box>

                        <Box p="5">
                          <Flex gap="2" mb="3" wrap="wrap">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Flex key={tag.id} align="center" gap="1">
                                <Tag
                                  size={10}
                                  style={{ color: "var(--gray-10)" }}
                                />
                                <Text size="1" color="gray">
                                  {tag.name}
                                </Text>
                              </Flex>
                            ))}
                          </Flex>

                          <Heading
                            size="4"
                            mb="2"
                            style={{ color: "var(--gray-12)" }}
                          >
                            {post.title}
                          </Heading>

                          <Text
                            size="2"
                            mb="4"
                            style={{
                              color: "var(--gray-11)",
                              lineHeight: 1.6,
                              display: "block",
                            }}
                          >
                            {(post.excerpt || "").slice(0, 100)}...
                          </Text>

                          <Flex align="center" justify="between">
                            <Flex align="center" gap="3">
                              <Text size="1" color="gray">
                                {formatDate(post.published_at)}
                              </Text>
                            </Flex>
                            <ArrowRight
                              size={16}
                              style={{ color: `var(--${post.color || "gray"}-9)` }}
                            />
                          </Flex>
                        </Box>
                      </Box>
                    </Link>
                  </motion.div>
                );
              })}
            </Grid>

            {/* Load more */}
            {hasMorePosts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <Flex justify="center" mt="9">
                  <button
                    onClick={loadMorePosts}
                    style={{
                      padding: "14px 32px",
                      borderRadius: 9999,
                      border: "1px solid var(--gray-a6)",
                      background: "transparent",
                      color: "var(--gray-11)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Charger plus d&apos;articles
                  </button>
                </Flex>
              </motion.div>
            )}

            {/* No results message */}
            {displayedPosts.length === 0 && (
              <Box
                p="8"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  textAlign: "center",
                }}
              >
                <BookOpen
                  size={48}
                  style={{ color: "var(--gray-8)", marginBottom: 16 }}
                />
                <Heading size="4" mb="2" color="gray">
                  Aucun article
                </Heading>
                <Text size="3" color="gray">
                  Aucun article dans cette catégorie pour le moment.
                </Text>
              </Box>
            )}
          </>
        )}

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Box mt="9">
            <Newsletter
              title="Restez informé"
              description="Recevez nos derniers articles et conseils directement dans votre boîte mail."
            />
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
