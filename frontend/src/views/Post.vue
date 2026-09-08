<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getPost } from "../api/post";
import { renderMarkdown } from "../utils/markdown";
import type { Post } from "../types";

const route = useRoute();
const post = ref<Post | null>(null);
const loading = ref<boolean>(true);
const error = ref<string>("");
let requestVersion: number = 0;
const html = computed<string>(() => renderMarkdown(post.value?.content || ""));
async function loadPost(): Promise<void> {
  const version: number = ++requestVersion;
  loading.value = true;
  error.value = "";
  post.value = null;
  const id: number = Number(route.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    error.value = "文章地址无效";
    loading.value = false;
    return;
  }
  try {
    const response: Post = await getPost(id);
    if (version === requestVersion) {
      post.value = response;
      document.title = `${response.title} · DEV.LOG`;
    }
  } catch (cause: unknown) {
    if (version === requestVersion)
      error.value = cause instanceof Error ? cause.message : "文章加载失败";
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
watch(() => route.params.id, loadPost, { immediate: true });
</script>

<template>
  <div class="page-shell post-page">
    <RouterLink to="/blog" class="back-link">← 返回文章列表</RouterLink>
    <div v-if="loading" class="state-panel large-state" role="status">
      <span class="loading-dot"></span>正在打开文章…
    </div>
    <div v-else-if="error" class="empty-state" role="alert">
      <span class="eyebrow">NOTE UNAVAILABLE</span>
      <h1>这篇文章暂时无法阅读</h1>
      <p>{{ error }}</p>
      <button class="button" @click="loadPost">重新加载 ↻</button>
    </div>
    <article v-else-if="post">
      <header class="post-heading">
        <div class="tag-list">
          <RouterLink
            v-for="tag in post.tags"
            :key="tag"
            :to="{ name: 'blog', query: { tag } }"
            class="tag"
            ># {{ tag }}</RouterLink
          >
        </div>
        <h1>{{ post.title }}</h1>
        <p v-if="post.summary" class="post-summary">{{ post.summary }}</p>
        <div class="post-meta">
          <span
            >发布于
            <time :datetime="post.createdAt">{{
              formatDate(post.createdAt)
            }}</time></span
          ><span
            >更新于
            <time :datetime="post.updatedAt">{{
              formatDate(post.updatedAt)
            }}</time></span
          >
        </div>
      </header>
      <!-- 仅使用 renderMarkdown 返回的 DOMPurify 清洗结果，禁止直接渲染原始内容。 -->
      <div class="markdown-body" v-html="html"></div>
      <div class="post-ending">
        <span class="eyebrow">THANKS FOR READING</span>
        <p>记录到这里，思考仍在继续。</p>
        <RouterLink class="inline-link" to="/blog"
          >继续阅读其他文章 →</RouterLink
        >
      </div>
    </article>
  </div>
</template>
