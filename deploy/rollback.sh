#!/usr/bin/env bash
# 回滚线上代码(在本地 Git Bash 运行):
#   ./deploy/rollback.sh          回到上一个版本
#   ./deploy/rollback.sh <版本ID> 回到指定版本
#   ./deploy/rollback.sh -l       查看服务器上的所有版本(当前在最上)
# 只切回代码,不改数据库;数据库自动备份在服务器 /var/backups/devlog-db/。
set -euo pipefail

INSTANCE_ID="${INSTANCE_ID:-i-2ze85l52zynk1r634t66}"
REGION="${REGION:-cn-beijing}"
WB="${WORKBENCH:-/c/Program Files/workbench/workbench.exe}"
[ -x "$WB" ] || WB="$(command -v workbench || true)"
[ -n "$WB" ] || { echo "找不到 workbench CLI,请设置 WORKBENCH 环境变量"; exit 1; }

# 服务器脚本由 deploy.sh 部署:常驻 /usr/local/lib,/tmp 里是最近一次的副本。
RUN='bash /usr/local/lib/devlog-remote.sh'
FALLBACK='[ -f /tmp/devlog-remote.sh ] && bash /tmp/devlog-remote.sh'

wb() { MSYS_NO_PATHCONV=1 "$WB" "$@"; }

case "${1:-}" in
  -l|--list)
    wb exec -i "$INSTANCE_ID" -r "$REGION" --timeout 60 \
      -c "$RUN releases || { $FALLBACK releases; }"
    ;;
  -h|--help|'')
    sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    wb exec -i "$INSTANCE_ID" -r "$REGION" --timeout 300 \
      -c "$RUN rollback $1 || { $FALLBACK rollback $1; }"
    ;;
esac
