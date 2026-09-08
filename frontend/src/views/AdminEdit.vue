<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from "vue-router";
import { deletePost, getAdminPost, getAdminPosts, savePost } from "../api/post";
import { clearToken } from "../api/request";
import type {
  PageResult,
  Post,
  PostStatus,
  PostSummary,
  SavePostInput,
} from "../types";

const route = useRoute();
const router = useRouter();
const form = reactive<SavePostInput>({
  title: "",
  summary: "",
  content: "",
  tags: [],
  status: "draft",
});
const tagInput = ref<string>("");
const currentId = ref<number | undefined>();
const baseline = ref<string>("");
const loading = ref<boolean>(false);
const saving = ref<boolean>(false);
const deleting = ref<boolean>(false);
const loadError = ref<string>("");
const error = ref<string>("");
const notice = ref<string>("");
const listError = ref<string>("");
const listLoading = ref<boolean>(false);
const page = ref<number>(1);
const list = ref<PageResult<PostSummary>>({
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
});
let editorVersion: number = 0;
let listVersion: number = 0;
let internalDestination: string | null = null;
const pageCount = computed<number>(() =>
  Math.max(1, Math.ceil(list.value.total / list.value.pageSize)),
);
const busy = computed<boolean>(
  () => loading.value || saving.value || deleting.value,
);
function snapshot(): string {
  return JSON.stringify({
    title: form.title,
    summary: form.summary,
    content: form.content,
    tagInput: tagInput.value,
    status: form.status,
  });
}
const dirty = computed<boolean>(() => snapshot() !== baseline.value);
function resetForm(post?: Post): void {
  currentId.value = post?.id;
  Object.assign(form, {
    title: post?.title || "",
    summary: post?.summary || "",
    content: post?.content || "",
    tags: post?.tags || [],
    status: post?.status || "draft",
  });
  tagInput.value = post?.tags.join(", ") || "";
  baseline.value = snapshot();
}
async function loadEditor(): Promise<void> {
  const version: number = ++editorVersion;
  loading.value = true;
  loadError.value = "";
  error.value = "";
  resetForm();
  const rawId: unknown = route.params.id;
  if (!rawId) {
    loading.value = false;
    return;
  }
  const id: number = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    loadError.value = "文章地址无效";
    loading.value = false;
    return;
  }
  try {
    const post: Post = await getAdminPost(id);
    if (version === editorVersion) resetForm(post);
  } catch (cause: unknown) {
    if (version === editorVersion)
      loadError.value = cause instanceof Error ? cause.message : "文章加载失败";
  } finally {
    if (version === editorVersion) loading.value = false;
  }
}
async function loadList(): Promise<void> {
  const version: number = ++listVersion;
  listLoading.value = true;
  listError.value = "";
  try {
    const response: PageResult<PostSummary> = await getAdminPosts({
      page: page.value,
      pageSize: 8,
    });
    if (version !== listVersion) return;
    list.value = response;
    if (page.value > pageCount.value) {
      page.value = pageCount.value;
      await loadList();
    }
  } catch (cause: unknown) {
    if (version === listVersion)
      listError.value = cause instanceof Error ? cause.message : "列表加载失败";
  } finally {
    if (version === listVersion) listLoading.value = false;
  }
}
async function submit(status: PostStatus): Promise<void> {
  if (busy.value || loadError.value) return;
  error.value = "";
  notice.value = "";
  const tags: string[] = [
    ...new Set(
      tagInput.value
        .split(/[,，]/)
        .map((tag: string): string => tag.trim())
        .filter(Boolean),
    ),
  ];
  if (!form.title.trim() || !form.content.trim()) {
    error.value = "标题和正文不能为空，草稿也需要这两个字段。";
    return;
  }
  if (tags.length > 8 || tags.some((tag: string): boolean => tag.length > 30)) {
    error.value = "最多 8 个标签，每个标签不超过 30 个字符。";
    return;
  }
  saving.value = true;
  try {
    const input: SavePostInput = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content,
      tags,
      status,
    };
    const post: Post = await savePost(input, currentId.value);
    resetForm(post);
    notice.value =
      status === "published"
        ? "文章已发布，可在前台阅读。"
        : "草稿已保存，不会在前台展示。";
    // 保存期间保持按钮锁定，只放行本次保存发起的路由变更。
    if (String(route.params.id || "") !== String(post.id))
      await navigateInternally(`/admin/edit/${post.id}`);
    await loadList();
  } catch (cause: unknown) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "保存失败，内容仍保留在编辑器中。";
  } finally {
    saving.value = false;
  }
}
async function removeCurrent(): Promise<void> {
  if (currentId.value === undefined || busy.value) return;
  if (!window.confirm(`确定永久删除「${form.title}」吗？此操作无法恢复。`))
    return;
  deleting.value = true;
  error.value = "";
  notice.value = "";
  try {
    await deletePost(currentId.value);
    resetForm();
    notice.value = "文章已删除。";
    await navigateInternally("/admin/edit");
    await loadList();
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : "删除失败";
  } finally {
    deleting.value = false;
  }
}
async function navigateInternally(destination: string): Promise<void> {
  internalDestination = destination;
  try {
    await router.replace(destination);
  } finally {
    internalDestination = null;
  }
}
function allowNavigation(destination?: string): boolean {
  if (destination && destination === internalDestination) return true;
  if (saving.value || deleting.value) return false;
  return !dirty.value || window.confirm("有尚未保存的内容，确定离开吗？");
}
function beforeUnload(event: BeforeUnloadEvent): void {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
function logout(): void {
  if (!allowNavigation()) return;
  baseline.value = snapshot();
  clearToken();
  void router.replace("/login");
}
function changePage(next: number): void {
  page.value = next;
  void loadList();
}
onBeforeRouteLeave((to): boolean => allowNavigation(to.fullPath));
onBeforeRouteUpdate((to): boolean => allowNavigation(to.fullPath));
watch(() => route.params.id, loadEditor, { immediate: true });
onMounted((): void => {
  void loadList();
  window.addEventListener("beforeunload", beforeUnload);
});
onBeforeUnmount((): void => {
  editorVersion++;
  listVersion++;
  window.removeEventListener("beforeunload", beforeUnload);
});
</script>

<template>
  <div class="page-shell admin-page">
    <header class="admin-heading">
      <div>
        <span class="eyebrow">YOUR WRITING DESK</span>
        <h1>文章工作台<span class="heading-dot">.</span></h1>
        <p>把思考写下来，再慢慢打磨。</p>
      </div>
      <button class="button small" @click="logout" :disabled="busy">
        退出登录 ↗
      </button>
    </header>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-heading">
          <h2>
            我的文章 <span>{{ list.total }}</span>
          </h2>
          <RouterLink to="/admin/edit" class="icon-button" aria-label="新建文章"
            >＋</RouterLink
          >
        </div>
        <div v-if="listLoading" class="sidebar-state" role="status">
          加载中…
        </div>
        <div v-else-if="listError" class="sidebar-state" role="alert">
          <p>{{ listError }}</p>
          <button class="button small" @click="loadList">重试</button>
        </div>
        <div v-else-if="!list.items.length" class="sidebar-state">
          还没有文章，<br />从右侧写下第一篇吧。
        </div>
        <nav v-else class="admin-post-list" aria-label="选择文章">
          <RouterLink
            v-for="post in list.items"
            :key="post.id"
            :to="`/admin/edit/${post.id}`"
            :class="{ selected: currentId === post.id }"
            ><strong>{{ post.title }}</strong
            ><span
              ><i :class="post.status"></i
              >{{ post.status === "published" ? "已发布" : "草稿"
              }}<time :datetime="post.updatedAt">{{
                new Date(post.updatedAt).toLocaleDateString("zh-CN")
              }}</time></span
            ></RouterLink
          >
        </nav>
        <div v-if="pageCount > 1" class="sidebar-pagination">
          <button
            class="icon-button"
            :disabled="page <= 1 || listLoading"
            @click="changePage(page - 1)"
            aria-label="上一页"
          >
            ←</button
          ><span>{{ page }} / {{ pageCount }}</span
          ><button
            class="icon-button"
            :disabled="page >= pageCount || listLoading"
            @click="changePage(page + 1)"
            aria-label="下一页"
          >
            →
          </button>
        </div>
      </aside>
      <section class="editor-panel">
        <div class="editor-heading">
          <div>
            <span class="eyebrow">{{
              currentId
                ? `NOTE / ${String(currentId).padStart(3, "0")}`
                : "A NEW BEGINNING"
            }}</span>
            <h2>{{ currentId ? "编辑文章" : "新建文章" }}</h2>
          </div>
          <span class="editor-state"
            ><span class="tiny-dot" :class="{ unsaved: dirty }"></span
            >{{
              dirty
                ? "有未保存的修改"
                : currentId
                  ? form.status === "published"
                    ? "已发布 · 已保存"
                    : "草稿 · 已保存"
                  : "准备就绪"
            }}</span
          >
        </div>
        <p v-if="notice" class="success-message" role="status">{{ notice }}</p>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <div v-if="loadError" class="state-panel" role="alert">
          <p>{{ loadError }}</p>
          <button class="button small" @click="loadEditor">重新加载</button
          ><RouterLink to="/admin/edit" class="inline-link"
            >新建文章 →</RouterLink
          >
        </div>
        <div v-else-if="loading" class="state-panel large-state" role="status">
          正在加载正文…
        </div>
        <form v-else @submit.prevent="submit('published')">
          <fieldset :disabled="busy">
            <label for="post-title"
              >文章标题 <span>必填 · 最多 160 字</span></label
            ><input
              id="post-title"
              v-model="form.title"
              class="title-input"
              maxlength="160"
              required
              placeholder="给这次思考起个名字"
            /><label for="post-tags"
              >标签 <span>用逗号分隔，最多 8 个</span></label
            ><input
              id="post-tags"
              v-model="tagInput"
              maxlength="300"
              placeholder="例如：TypeScript, NestJS, 工程实践"
            /><label for="post-summary"
              >文章摘要 <span>{{ form.summary.length }} / 500</span></label
            ><textarea
              id="post-summary"
              v-model="form.summary"
              rows="3"
              maxlength="500"
              placeholder="用几句话，告诉读者这篇文章值得读的原因。"
            ></textarea>
            <div class="content-label">
              <label for="post-content">正文 <span>Markdown · 必填</span></label
              ><span>{{ form.content.length.toLocaleString() }} / 100,000</span>
            </div>
            <textarea
              id="post-content"
              v-model="form.content"
              class="markdown-editor"
              rows="19"
              maxlength="100000"
              spellcheck="false"
              required
              placeholder="## 从一个问题开始&#10;&#10;写下背景、你的思考，以及验证的过程。&#10;&#10;```typescript&#10;const idea: string = 'Hello, world';&#10;```"
            ></textarea>
            <p class="editor-hint">
              支持标题、列表、引用与代码块。原始 HTML
              将作为文本显示；草稿仅对管理员可见。
            </p>
            <div class="editor-actions">
              <button
                v-if="currentId"
                type="button"
                class="button danger text-button"
                @click="removeCurrent"
              >
                删除文章</button
              ><RouterLink
                v-if="currentId && form.status === 'published'"
                :to="`/blog/${currentId}`"
                class="inline-link"
                >查看文章 ↗</RouterLink
              >
              <div>
                <button type="button" class="button" @click="submit('draft')">
                  {{
                    saving
                      ? "保存中…"
                      : form.status === "published"
                        ? "转为草稿"
                        : "存草稿"
                  }}</button
                ><button type="submit" class="button primary">
                  {{
                    saving
                      ? "保存中…"
                      : form.status === "published"
                        ? "更新发布"
                        : "发布文章"
                  }}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  </div>
</template>
