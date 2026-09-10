#!/usr/bin/env bash
# 一键部署(在本地 Git Bash 运行):
#   打包工作区 -> workbench 上传 ECS -> 服务器解包构建为新版本 -> 数据库备份 -> 软链切换 -> 健康检查
#   健康检查失败会自动切回上一版本。
# 用法:./deploy/deploy.sh [-y]   (-y 跳过"工作区有未提交改动"确认)
# 可用环境变量覆盖:INSTANCE_ID / REGION / WORKBENCH
set -euo pipefail
cd "$(dirname "$0")/.."

INSTANCE_ID="${INSTANCE_ID:-i-2ze85l52zynk1r634t66}"
REGION="${REGION:-cn-beijing}"
PUBLIC_IP="${PUBLIC_IP:-123.57.214.28}"
WB="${WORKBENCH:-/c/Program Files/workbench/workbench.exe}"
[ -x "$WB" ] || WB="$(command -v workbench || true)"
[ -n "$WB" ] || { echo "找不到 workbench CLI,请设置 WORKBENCH 环境变量"; exit 1; }

wb() { MSYS_NO_PATHCONV=1 "$WB" "$@"; }

ASSUME_YES=0
[ "${1:-}" = "-y" ] && ASSUME_YES=1

GIT_SHA="$(git rev-parse --short HEAD)"
if [ -n "$(git status --porcelain)" ]; then DIRTY=1; else DIRTY=0; fi
if [ "$DIRTY" = 1 ] && [ "$ASSUME_YES" = 0 ]; then
  git status --short
  read -r -p "工作区有以上未提交改动,仍要部署? [y/N] " ans
  case "$ans" in y|Y) ;; *) echo "已取消"; exit 1 ;; esac
fi
ID="$(date +%Y%m%d-%H%M%S)-g${GIT_SHA}"
[ "$DIRTY" = 1 ] && ID="${ID}-dirty"

TMPDIR_LOCAL="$(mktemp -d)"
TARBALL="$TMPDIR_LOCAL/devlog-$ID.tar.gz"
REMOTE_TAR="/tmp/devlog-$ID.tar.gz"
REMOTE_SCRIPT=/tmp/devlog-remote.sh

echo "[local] 打包 $ID"
printf '%s %s\n' "$(date -Iseconds)" "$ID" >> .deploy-meta
tar czf "$TARBALL" \
  --exclude=node_modules --exclude=.git --exclude=dist \
  --exclude=.env --exclude='*.log' --exclude=.deploy-meta .

echo "[local] 上传 tar 包"
wb upload "$(cygpath -w "$TARBALL" 2>/dev/null || printf '%s' "$TARBALL")" "$REMOTE_TAR" -i "$INSTANCE_ID" -r "$REGION" -f >/dev/null

echo "[local] 服务器:解包 + 安装依赖 + 构建(可能需要几分钟)"
wb exec -i "$INSTANCE_ID" -r "$REGION" --timeout 900 -c "
set -e
rm -rf /tmp/devlog-bootstrap && mkdir -p /tmp/devlog-bootstrap
tar xzf $REMOTE_TAR -C /tmp/devlog-bootstrap ./deploy/remote/deploy-remote.sh
tr -d '\r' < /tmp/devlog-bootstrap/deploy/remote/deploy-remote.sh > $REMOTE_SCRIPT
cp $REMOTE_SCRIPT /usr/local/lib/devlog-remote.sh
bash $REMOTE_SCRIPT stage $REMOTE_TAR $ID
"

echo "[local] 服务器:备份数据库 + 切换版本 + 健康检查"
wb exec -i "$INSTANCE_ID" -r "$REGION" --timeout 300 -c "bash $REMOTE_SCRIPT activate $ID"

echo "[local] 公网验证"
sleep 2
code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://$PUBLIC_IP/" || true)"
[ "$code" = 200 ] || { echo "警告:公网首页返回 $code,请人工检查 http://$PUBLIC_IP/"; }
echo "[local] 完成,线上版本:$ID(首页 HTTP $code)"

rm -rf "$TMPDIR_LOCAL"
cat <<'EOF'

如出问题,回滚:
  ./deploy/rollback.sh            # 回到上一个版本
  ./deploy/rollback.sh <版本ID>   # 回到指定版本(可用 ./deploy/rollback.sh -l 查看)
EOF
