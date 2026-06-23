// ==UserScript==
// @name         Noct Patched (Modular)
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const BASE_URL = 'https://raw.githubusercontent.com/NotXina/noct-patched/main/modules';

    const MODULES = [
        'noct_core.js',
        'noct_subscription.js',
        'noct_ui.js',
        'noct_building.js',
        'noct_recruit.js',
        'noct_culture.js',
        'noct_resources.js',
        'noct_farmtown.js',
        'noct_research.js',
        'noct_auto_rural.js',
        'noct_trade.js',
        'noct_auto_recruit.js',
        'noct_attack.js',
        'noct_support.js',
        'noct_movements.js',
        'noct_auto_quest.js',
        'noct_scheduler.js',
        'noct_discord.js',
        'noct_commands.js',
        'noct_trade_adv.js',
        'noct_shortcuts.js',
        'noct_world_map.js',
        'noct_send_units.js',
        'noct_bootcamp.js',
        'noct_auto_pop.js'
    ];

    const ALLOWED = ['grepolis.com', 'grepo-soft', 'githubusercontent.com'];
    const isAllowed = url => {
        if (!url) return true;
        const s = String(url);
        return s.startsWith('/') || s.startsWith('blob:') || ALLOWED.some(d => s.includes(d));
    };

    // Bloquear fetch/XHR externos
    const _origFetch = window.fetch;
    window.fetch = function(url, opts) {
        if (!isAllowed(url)) return Promise.resolve(new Response('{}', { status: 200 }));
        return _origFetch.apply(this, arguments);
    };
    const _origOpen = XMLHttpRequest.prototype.open;
    const _origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.__url = url || '';
        return _origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
        if (!isAllowed(this.__url)) {
            const self = this;
            setTimeout(() => {
                Object.defineProperty(self, 'readyState', { configurable: true, get: () => 4 });
                Object.defineProperty(self, 'status', { configurable: true, get: () => 200 });
                Object.defineProperty(self, 'responseText', { configurable: true, get: () => '{}' });
                if (self.onload) self.onload();
                if (self.onreadystatechange) self.onreadystatechange();
            }, 0);
            return;
        }
        return _origSend.apply(this, arguments);
    };

    // Carregar módulos em sequência
    function loadModule(index) {
        if (index >= MODULES.length) {
            console.log('[Noct] Todos os módulos carregados!');
            return;
        }
        const mod = MODULES[index];
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${BASE_URL}/${mod}`,
            headers: { 'Cache-Control': 'no-cache' },
            onload: function(r) {
                if (r.status === 200) {
                    try {
                        new Function(r.responseText)();
                        console.log(`[Noct] ✓ ${mod}`);
                    } catch(e) {
                        console.error(`[Noct] ✗ Erro em ${mod}:`, e.message);
                    }
                } else {
                    console.error(`[Noct] ✗ HTTP ${r.status} ao carregar ${mod}`);
                }
                loadModule(index + 1);
            },
            onerror: function() {
                console.error(`[Noct] ✗ Falha de rede ao carregar ${mod}`);
                loadModule(index + 1);
            }
        });
    }

    function waitForGame() {
        if (typeof Game !== 'undefined' && Game.player_id) {
            console.log('[Noct] Game detectado, carregando módulos...');
            loadModule(0);
        } else {
            setTimeout(waitForGame, 500);
        }
    }

    waitForGame();
})();
