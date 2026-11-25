#!/bin/sh
set -eu

if [ "${SSHHUB_CONFIG+x}" ]; then
    mkdir -p /tmp/ssh-hub
    printf '%s\n' "$SSHHUB_CONFIG" > /tmp/ssh-hub/config.json
elif [ "${SSHHUB_TITLE+x}${SSHHUB_SUBTITLE+x}${SSHHUB_LINKS+x}${SSHHUB_THEME_COLORS+x}" ]; then
    mkdir -p /tmp/ssh-hub
    config=/usr/share/nginx/html/config.json
    if [ ! -f "$config" ]; then
        config=/etc/ssh-hub/defaults.json
    fi

    jq -cs '
        def envjson($name): env[$name] | try fromjson catch null;

        if length == 1 and (.[0] | type == "object") then
            .[0]
            | if env | has("SSHHUB_TITLE") then .title = env.SSHHUB_TITLE else . end
            | if env | has("SSHHUB_SUBTITLE") then .subtitle = env.SSHHUB_SUBTITLE else . end
            | if env | has("SSHHUB_LINKS") then .links = envjson("SSHHUB_LINKS") else . end
            | if env | has("SSHHUB_THEME_COLORS") then .theme.colors = envjson("SSHHUB_THEME_COLORS") else . end
        else
            null
        end
    ' "$config" > /tmp/ssh-hub/config.json || printf 'null\n' > /tmp/ssh-hub/config.json
fi

exec "$@"
