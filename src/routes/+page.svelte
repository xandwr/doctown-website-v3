<script lang="ts">
</script>

<main class="min-h-screen">
	<!-- Hero: Immediate Hook -->
	<section
		class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 md:py-20"
	>
		<div class="max-w-[900px] mx-auto px-5 md:px-16">
			<h1
				class="text-[2.5rem] leading-[1.15] sm:text-5xl md:text-7xl xl:text-8xl font-normal md:leading-tight mb-4 sm:mb-6 tracking-tight"
			>
				Documentation is a dependency.
			</h1>
			<p
				class="text-lg sm:text-xl md:text-2xl text-neutral-600 leading-normal"
			>
				Let's treat it like one.
			</p>
		</div>
	</section>

	<!-- Quick Start: For Speedy Devs -->
	<section class="py-8 md:py-12 border-t border-neutral-900/50">
		<div class="max-w-[700px] mx-auto px-6 md:px-16 text-center">
			<p class="text-sm text-neutral-600 mb-3">Know what you're doing?</p>
			<div
				class="rounded-xl border border-neutral-800 px-4 py-3 md:px-6 md:py-4 text-sm md:text-base leading-relaxed overflow-x-auto text-left inline-block"
			>
				<code class="text-neutral-300 whitespace-nowrap">
					$ cargo install localdoc
				</code>
			</div>
		</div>
	</section>

	<!-- The Manifesto: Why This Exists -->
	<section class="py-20 md:py-32 border-t border-neutral-900">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2
				class="text-3xl md:text-5xl font-normal mb-10 md:mb-16 tracking-tight"
			>
				Why Doctown exists.
			</h2>
			<div class="max-w-[700px] space-y-6">
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					Corporate documentation is a scam. A business model dressed
					as a public good.
				</p>
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					You don't need a dashboard to search a string. You don't
					need a login to read a function signature. You don't need
					cookie banners, analytics trackers, and 2MB of JavaScript to
					find out how <code
						class="bg-neutral-900 px-1.5 py-0.5 rounded text-green-500 text-[0.95em]"
						>async/await</code
					> works.
				</p>
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					You don't need <a
						href="https://www.gitbook.com/pricing"
						target="_blank"
						rel="noopener noreferrer"
						class="text-neutral-600 hover:text-neutral-400 transition-colors"
						>GitBook</a
					>
					upselling you on "team seats." You don't need
					<a
						href="https://www.mintlify.com/pricing"
						target="_blank"
						rel="noopener noreferrer"
						class="text-green-200 hover:text-green-100 transition-colors"
						>Mintlify</a
					>
					charging you $250/month to host your docs. You don't need
					<a
						href="https://www.atlassian.com/software/confluence"
						target="_blank"
						rel="noopener noreferrer"
						class="text-blue-500 hover:text-blue-400 transition-colors"
						>Confluence</a
					>
					making you click through three dropdowns to copy a code snippet.
				</p>
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					Docs should be <strong class="text-white font-normal"
						>local</strong
					>,
					<strong class="text-white font-normal">fast</strong>, and
					<strong class="text-white font-normal">offline</strong>.
					They should live in your terminal, not on a dashboard.
				</p>
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					<strong class="text-white font-normal"
						>Localdoc is the alternative.</strong
					> A CLI you own. Docs you control. No middleman.
				</p>
				<p class="text-lg md:text-xl text-neutral-300 leading-relaxed">
					Save yourself another documentation-related "meditation
					walk."
				</p>
			</div>
		</div>
	</section>

	<!-- The Model: Free vs Premium -->
	<section class="py-20 md:py-32 border-t border-neutral-900">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2
				class="text-3xl md:text-5xl font-normal mb-10 md:mb-16 tracking-tight"
			>
				The model.
			</h2>
			<p
				class="text-xl text-neutral-300 text-center mb-16 leading-normal"
			>
				<strong class="text-white font-normal"
					>Consumption is free. Creation is paid.</strong
				>
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-12">
				<div>
					<h3 class="text-2xl font-normal mb-5 text-white">
						Free. Forever.
					</h3>
					<ul class="list-none p-0 mb-5 space-y-2">
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-neutral-600"
						>
							Install unlimited docpacks
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-neutral-600"
						>
							CLI tool (open source)
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-neutral-600"
						>
							Offline doc queries
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-neutral-600"
						>
							Local-first. No tracking.
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-neutral-600"
						>
							Search and discover all public docpacks
						</li>
					</ul>
					<p class="text-sm text-neutral-600 italic leading-normal">
						Everything you need to build.
					</p>
					<p class="text-sm text-red-500 opacity-60 mt-3 italic">
						Cannot publish docpacks.
					</p>
				</div>
				<div>
					<h3 class="text-2xl font-normal mb-5 text-white">
						Creator Tier. $10 USD/mo.
					</h3>
					<ul class="list-none p-0 mb-5 space-y-2">
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							Publish unlimited docpacks
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							AI auto-generates docpacks from GitHub repos
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							Monthly compute tokens
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							Creator dashboard with analytics
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							Verified badge (GitHub-linked)
						</li>
						<li
							class="text-base text-neutral-400 leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-green-500"
						>
							Priority support
						</li>
					</ul>
					<p class="text-cyan-400 text-sm leading-normal">
						5-10 hours saved per project.<br />
						Link repo → Get docpack → Done.
					</p>
				</div>
			</div>
			<p
				class="text-lg md:text-xl text-neutral-400 leading-relaxed mb-6 pt-8 border-t border-neutral-800"
			>
				<strong class="text-white"
					>You're not paying for hosting.</strong
				><br />
				You're paying for an AI agent that reads your codebase and generates
				production-ready documentation automatically. No more manual doc
				writing. No more copy-pasting between formats. Link your repo, allocate
				tokens, publish in minutes.
			</p>

			<p
				class="text-lg md:text-xl text-neutral-400 leading-relaxed pt-8 border-t border-neutral-800"
			>
				<strong class="text-white">Like npm. For docs.</strong><br />
				Anyone can install for free. Only creators pay—and they get automation
				that makes it worth every cent. Your docs become instantly installable
				by thousands of devs worldwide. That's just the bonus.
			</p>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="py-16 md:py-20 text-center border-t border-neutral-900">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2 class="text-3xl md:text-5xl font-normal mb-8 tracking-tight">
				Stop the bleeding.
			</h2>
			<div
				class="rounded-xl border border-neutral-700 px-4 py-4 md:px-8 md:py-8 text-sm md:text-base leading-relaxed mb-6 overflow-x-auto max-w-[500px] mx-auto text-left"
			>
				<div class="text-white whitespace-nowrap">
					$ cargo install localdoc
				</div>
			</div>
			<p class="text-base text-neutral-600 leading-relaxed">
				Documentation for people who actually build things.
			</p>
		</div>
	</section>

	<!-- Footer -->
	<section class="py-16 md:py-20 text-center border-t border-neutral-800">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<p class="text-sm text-neutral-600 mb-3">
				Built by <a
					href="https://github.com/xandwr"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-200 hover:text-blue-100 transition-colors"
					>crazy</a
				> to keep others sane.
			</p>
			<p class="flex items-center justify-center gap-3 text-sm">
				<a
					href="https://github.com/xandwr/doctown-monorepo"
					target="_blank"
					rel="noopener"
					class="text-neutral-400 hover:text-white transition-colors no-underline"
					>GitHub</a
				>
				<span class="text-neutral-700">•</span>
				<a
					href="https://discord.gg/r8rbntTaKQ"
					target="_blank"
					rel="noopener"
					class="text-neutral-400 hover:text-white transition-colors no-underline"
					>Discord</a
				>
			</p>
		</div>
	</section>
</main>
