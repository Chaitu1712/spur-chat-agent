<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { Trash2, Copy, Send, Loader2 } from 'lucide-svelte';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
    import { goto } from '$app/navigation';

	type Message = { role: 'user' | 'ai' | 'error'; content: string };
	type SessionMeta = { id: string; preview: string; date: string };

	let sessionId = $state<string | null>(null);
	let messages = $state<Message[]>([]);
	let currentInput = $state('');
	let isLoading = $state(false);
	let recentSessions = $state<SessionMeta[]>([]);
	let chatContainer = $state<HTMLElement | undefined>(undefined);

	$effect(() => {
		const sid = $page.url.searchParams.get('session');
		
		if (sid && sid !== sessionId) {
			sessionId = sid;
			loadSession(sid);
		} else if (!sid) {
			// Handle "New Chat" (when session is cleared)
			sessionId = null;
			messages = [{ role: 'ai', content: 'Hello! How can I help you today?' }];
		}
	});

	onMount(() => {
		const saved = localStorage.getItem('spur_sessions');
		if (saved) recentSessions = JSON.parse(saved);
	});

	async function loadSession(sid: string) {
		isLoading = true;
		try {
			const res = await fetch(`/api/chat/${sid}`);
			const data = await res.json();
			if (data.messages) {
				// Map DB roles to UI roles
				messages = data.messages.map((m: any) => ({
					role: m.role,
					content: m.content
				}));
				await scrollToBottom();
			}
		} catch (e) {
			console.error('Failed to load session');
		} finally {
			isLoading = false;
		}
	}

	async function sendMessage() {
		if (!currentInput.trim() || isLoading) return;

		const userText = currentInput.trim();
		currentInput = ''; 
		
		messages = [...messages, { role: 'user', content: userText }];
		isLoading = true;
		await scrollToBottom();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userText, sessionId })
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Server Error');

			if (!sessionId && data.sessionId) {
				sessionId = data.sessionId;
				window.history.replaceState({}, '', `?session=${sessionId}`);
				
				recentSessions = [
					{ id: sessionId, preview: userText.substring(0, 30) + '...', date: new Date().toLocaleTimeString() },
					...recentSessions
				];
				localStorage.setItem('spur_sessions', JSON.stringify(recentSessions));
			}

			messages = [...messages, { role: 'ai', content: data.reply }];
		} catch (error: any) {
			messages = [...messages, { 
				role: 'error', 
				content: "⚠️ I'm sorry, I encountered a network error. Please try again." 
			}];
		} finally {
			isLoading = false;
			await scrollToBottom();
		}
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function renderMarkdown(content: string) {
		const html = marked.parse(content) as string;
		return DOMPurify.sanitize(html);
	}

	function clearSession() {
		window.history.pushState({}, '', window.location.pathname);
        goto('/');
	}

	function copySessionId() {
		if (sessionId) navigator.clipboard.writeText(sessionId);
	}
</script>

<div class="max-w-6xl mx-auto h-screen p-4 flex flex-col md:flex-row gap-6">
	
	<!-- SIDEBAR -->
	<aside class="hidden md:flex flex-col w-64 glass-panel p-4 h-full">
		<h2 class="font-bold text-gray-900 mb-4 text-lg">Recent Sessions</h2>
		<div class="flex-col flex gap-2 overflow-y-auto">
			{#each recentSessions as s}
                <a 
                    href="?session={s.id}" 
                    class="block p-3 rounded-xl transition text-sm cursor-pointer border 
                    {sessionId === s.id ? 'bg-white/50 border-white/60 shadow-sm' : 'hover:bg-white/30 border-transparent'}"
                >
                    <div class="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">{s.date}</div>
                    <div class="text-gray-800 truncate font-medium">{s.preview}</div>
                </a>
            {/each}
			{#if recentSessions.length === 0}
				<p class="text-sm text-gray-500 italic">No recent chats.</p>
			{/if}
		</div>
	</aside>

	<!-- MAIN CHAT AREA -->
	<main class="flex-1 flex flex-col h-full relative">
		<header class="flex justify-between items-center mb-4">
			<h1 class="text-2xl font-bold text-gray-900">Spur Support Agent</h1>
			<div class="flex gap-2">
				<button onclick={clearSession} class="glass-btn flex items-center gap-2 text-sm">
					<Trash2 size={16} /> <span class="hidden sm:inline">Clear Conversation</span>
				</button>
				{#if sessionId}
					<button onclick={copySessionId} class="glass-btn flex items-center gap-2 text-sm" title="Copy ID">
						<Copy size={16} /> <span class="hidden sm:inline">Copy Session ID</span>
					</button>
				{/if}
			</div>
		</header>

		<div class="glass-panel flex-1 flex flex-col overflow-hidden relative shadow-2xl">
			
			<!-- MESSAGES -->
			<div bind:this={chatContainer} class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
				{#each messages as msg}
					<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[80%] rounded-2xl p-4 shadow-sm prose prose-sm leading-relaxed
							{msg.role === 'user' 
								? 'bg-blue-400/80 text-white rounded-br-none backdrop-blur-sm prose-p:text-white' 
								: msg.role === 'error'
								? 'bg-red-400/80 text-white rounded-bl-none backdrop-blur-sm'
								: 'bg-white/60 text-gray-800 rounded-bl-none backdrop-blur-sm prose-p:text-gray-800'}">
							{#if msg.role === 'user' || msg.role === 'error'}
								{msg.content}
							{:else}
								{@html renderMarkdown(msg.content)}
							{/if}
						</div>
					</div>
				{/each}

				{#if isLoading}
					<div class="flex justify-start">
						<div class="bg-white/40 backdrop-blur-sm text-gray-500 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 w-max">
							<Loader2 size={16} class="animate-spin" />
							<span class="text-sm">Agent is typing...</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- INPUT AREA -->
			<div class="p-4 bg-white/20 border-t border-white/30 backdrop-blur-md rounded-b-3xl">
				<div class="relative flex items-center">
					<textarea 
						bind:value={currentInput}
						onkeydown={handleKeydown}
						disabled={isLoading}
						placeholder="Type your message..." 
						class="w-full bg-white/70 backdrop-blur-md border border-white/50 text-gray-800 placeholder-gray-500 rounded-2xl pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none overflow-hidden h-12 flex-wrap"
						rows="1"
					></textarea>
					<button 
						onclick={sendMessage}
						disabled={!currentInput.trim() || isLoading}
						class="absolute right-2 bg-teal-500/80 hover:bg-teal-600 text-white rounded-xl px-4 py-1.5 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Send <Send size={16} />
					</button>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.glass-panel {
		background: rgba(255, 255, 255, 0.35);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 1.5rem;
	}
	.glass-btn {
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 0.75rem;
		color: #1f2937;
		transition: all 0.2s;
	}
	.glass-btn:hover {
		background: rgba(255, 255, 255, 0.4);
	}
</style>