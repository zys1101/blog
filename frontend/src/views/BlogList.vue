<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPosts } from "../api/post";
import type { PageResult, PostSummary } from "../types";

const route = useRoute();
const router = useRouter();
const result = ref<PageResult<PostSummary>>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 6,
});
const loading = ref<boolean>(true);
const error = ref<string>("");
const tagInput = ref<string>("");
let requestVersion: number = 0;
const page = computed<number>(() => {
  const value: number = Number(route.query.page || 1);
  return Number.isInteger(value) && value >= 1 && value <= 1000000 ? value : 1;
});
const selectedTag = computed<string>(() =>
  typeof route.query.tag === "string" ? route.query.tag.trim() : "",
);
const pages = computed<number>(() =>
  Math.max(1, Math.ceil(result.value.total / result.value.pageSize)),
);
const tags = computed<string[]>(() => [
  ...new Set(
    result.value.items.flatMap((post: PostSummary): string[] => post.tags),
  ),
]);
async function loadPosts(): Promise<void> {
  const version: number = ++requestVersion;
  loading.value = true;
  error.value = "";
  tagInput.value = selectedTag.value;
  try {
    const response: PageResult<PostSummary> = await getPosts({
      page: page.value,
      pageSize: 6,
      tag: selectedTag.value || undefined,
    });
    if (version === requestVersion) result.value = response;
  } catch (cause: unknown) {
    if (version === requestVersion)
      error.value = cause instanceof Error ? cause.message : "文章加载失败";
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
function navigate(nextPage: number, tag: string = selectedTag.value): void {
  void router.push({
    name: "blog",
    query: {
      ...(nextPage > 1 ? { page: String(nextPage) } : {}),
      ...(tag ? { tag } : {}),
    },
  });
}
function filterTag(): void {
  navigate(1, tagInput.value.trim());
}
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN").replaceAll("/", ".");
}
watch(() => [route.query.page, route.query.tag], loadPosts, {
  immediate: true,
});
</script>

<template>
  <div class="page-shell blog-page">
    <header class="page-heading">
      <span class="eyebrow">THE ENGINEERING NOTEBOOK</span>
      <h1>记录，是思考的另一半<span class="heading-dot">.</span></h1>
      <p>关于代码、设计与实践。把遇到的问题，写成下一次出发的路标。</p>
    </header>
    <div class="blog-toolbar">
      <div class="blog-filter-tags">
        <button
          class="filter-chip"
          :class="{ selected: !selectedTag }"
          @click="navigate(1, '')"
        >
          全部文章</button
        ><button
          v-if="selectedTag"
          class="filter-chip selected"
          @click="navigate(1, '')"
        >
          # {{ selectedTag }} <span aria-label="清除筛选">×</span></button
        ><template v-else
          ><button
            v-for="tag in tags.slice(0, 4)"
            :key="tag"
            class="filter-chip"
            @click="navigate(1, tag)"
          >
            # {{ tag }}
          </button></template
        >
      </div>
      <form class="tag-filter" @submit.prevent="filterTag">
        <label for="tag-filter">按标签筛选</label
        ><input
          id="tag-filter"
          v-model="tagInput"
          placeholder="完整标签名称"
          maxlength="30"
        /><button type="submit" class="button small">筛选</button>
      </form>
    </div>
    <p class="list-caption">
      {{ selectedTag ? `标签「${selectedTag}」` : "全部记录"
      }}<span v-if="!loading && !error"> / {{ result.total }} 篇文章</span>
    </p>
    <div v-if="loading" class="state-panel large-state" role="status">
      <span class="loading-dot"></span>正在加载文章…
    </div>
    <div v-else-if="error" class="state-panel large-state" role="alert">
      <div>
        <strong>暂时无法打开笔记本</strong>
        <p>{{ error }}</p>
      </div>
      <button class="button" @click="loadPosts">重试 ↻</button>
    </div>
    <div v-else-if="!result.items.length" class="empty-state">
      <span class="state-symbol">Aa</span>
      <h2>
        {{
          selectedTag
            ? "还没有这个标签的文章"
            : page > 1
              ? "这一页没有文章"
              : "第一篇文章，正在路上"
        }}
      </h2>
      <p>
        {{
          selectedTag
            ? "标签采用完整名称匹配，可以试试其他标签。"
            : "认真记录每一个值得分享的技术瞬间。"
        }}
      </p>
      <button
        v-if="selectedTag || page > 1"
        class="button"
        @click="navigate(1, '')"
      >
        查看全部文章 →</button
      ><RouterLink v-else class="button" to="/login">管理登录 ↗</RouterLink>
    </div>
    <div v-else class="blog-list">
      <article v-for="post in result.items" :key="post.id" class="blog-entry">
        <div class="entry-meta">
          <time :datetime="post.createdAt">{{
            formatDate(post.createdAt)
          }}</time
          ><span class="entry-meta-line"></span><span>TECHNICAL NOTE</span>
        </div>
        <RouterLink :to="`/blog/${post.id}`" class="entry-title"
          ><h2>{{ post.title }}</h2>
          <span aria-hidden="true">↗</span></RouterLink
        >
        <p>{{ post.summary || "暂无摘要，点击标题阅读全文。" }}</p>
        <div class="tag-list">
          <button
            v-for="tag in post.tags"
            :key="tag"
            class="tag tag-button"
            @click="navigate(1, tag)"
          >
            # {{ tag }}
          </button>
        </div>
      </article>
    </div>
    <nav
      v-if="!loading && !error && result.total > 0"
      class="pagination"
      aria-label="文章分页"
    >
      <span>第 {{ page }} 页 / 共 {{ pages }} 页</span>
      <div>
        <button
          class="button small"
          :disabled="page <= 1"
          @click="navigate(page - 1)"
        >
          ← 上一页</button
        ><button
          class="button small"
          :disabled="page >= pages"
          @click="navigate(page + 1)"
        >
          下一页 →
        </button>
      </div>
    </nav>
    <div class="notebook-end">
      <span></span>END OF PAGE · KEEP THINKING<span></span>
    </div>
  </div>
</template>
