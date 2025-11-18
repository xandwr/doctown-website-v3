<script lang="ts">
</script>

<main class="min-h-screen">
	<!-- Hero: Immediate Hook -->
	<section
		class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 md:py-20"
	>
		<div class="max-w-[900px] mx-auto px-5 md:px-16">
			<h1
				class="text-[2.5rem] leading-[1.15] sm:text-5xl md:text-7xl xl:text-8xl font-normal md:leading-tight mb-4 sm:mb-6 tracking-tight text-whisper"
			>
				Documentation is a dependency.
			</h1>
			<p
				class="text-lg sm:text-xl md:text-2xl text-shadow leading-normal"
			>
				Let's treat it like one.
			</p>
		</div>
	</section>

	<!-- Quick Start: For Speedy Devs -->
	<section class="py-8 md:py-12 border-t border-fog/30">
		<div class="max-w-[700px] mx-auto px-6 md:px-16 text-center">
			<p class="text-sm text-shadow mb-3">Know what you're doing?</p>
			<div
				class="rounded border border-ash px-4 py-3 md:px-6 md:py-4 text-sm md:text-base leading-relaxed overflow-x-auto text-left inline-block"
			>
				<code class="text-whisper whitespace-nowrap">
					$ cargo install localdoc
				</code>
			</div>
		</div>
	</section>

	<!-- The Manifesto: Why This Exists (SHOTS FIRED - Keep accent color) -->
	<section class="py-20 md:py-32 border-t border-fog">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2
				class="text-3xl md:text-5xl font-normal mb-10 md:mb-16 tracking-tight text-whisper"
			>
				Why Doctown exists.
			</h2>
			<div class="max-w-[700px] space-y-6">
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					Corporate documentation is a scam. A business model dressed
					as a public good.
				</p>
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					You don't need a dashboard to search a string. You don't
					need a login to read a function signature. You don't need
					cookie banners, analytics trackers, and 2MB of JavaScript to
					find out how <code
						class="bg-concrete px-1.5 py-0.5 text-corpse text-[0.95em]"
						>async/await</code
					> works.
				</p>
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					You don't need <a
						href="https://www.gitbook.com/pricing"
						target="_blank"
						rel="noopener noreferrer"
						class="text-decay hover:text-rust transition-colors"
						>GitBook</a
					>
					upselling you on "team seats." You don't need
					<a
						href="https://www.mintlify.com/pricing"
						target="_blank"
						rel="noopener noreferrer"
						class="text-blood hover:text-rust transition-colors"
						>Mintlify</a
					>
					charging you $250/month to host your docs. You don't need
					<a
						href="https://www.atlassian.com/software/confluence"
						target="_blank"
						rel="noopener noreferrer"
						class="text-blood hover:text-rust transition-colors"
						>Confluence</a
					>
					making you click through three dropdowns to copy a code snippet.
				</p>
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					Docs should be <strong class="text-white font-normal"
						>local</strong
					>,
					<strong class="text-white font-normal">fast</strong>, and
					<strong class="text-white font-normal">offline</strong>.
					They should live in your terminal, not on a dashboard.
				</p>
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					<strong class="text-white font-normal"
						>Localdoc is the alternative.</strong
					> A CLI you own. Docs you control. No middleman.
				</p>
				<p class="text-lg md:text-xl text-whisper leading-relaxed">
					Save yourself another documentation-related "meditation
					walk."
				</p>
			</div>
		</div>
	</section>

	<!-- The Model: Free vs Premium -->
	<section class="py-20 md:py-32 border-t border-fog">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2
				class="text-3xl md:text-5xl font-normal mb-10 md:mb-16 tracking-tight text-whisper"
			>
				The model.
			</h2>
			<p
				class="text-xl text-whisper text-center mb-16 leading-normal"
			>
				<strong class="text-white font-normal"
					>Consumption is free. Creation is paid.</strong
				>
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-12">
				<div>
					<h3 class="text-2xl font-normal mb-5 text-whisper">
						Free. Forever.
					</h3>
					<ul class="list-none p-0 mb-5 space-y-2">
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-shadow"
						>
							Install unlimited docpacks
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-shadow"
						>
							CLI tool (open source)
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-shadow"
						>
							Offline doc queries
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-shadow"
						>
							Local-first. No tracking.
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-shadow"
						>
							Search and discover all public docpacks
						</li>
					</ul>
					<p class="text-sm text-shadow italic leading-normal">
						Everything you need to build.
					</p>
					<p class="text-sm text-decay opacity-60 mt-3 italic">
						Cannot publish docpacks.
					</p>
				</div>
				<div>
					<h3 class="text-2xl font-normal mb-5 text-whisper">
						Creator Tier. $10 USD/mo.
					</h3>
					<ul class="list-none p-0 mb-5 space-y-2">
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							Publish unlimited docpacks
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							AI auto-generates docpacks from GitHub repos
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							Monthly compute tokens
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							Creator dashboard with analytics
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							Verified badge (GitHub-linked)
						</li>
						<li
							class="text-base text-echo leading-relaxed pl-5 relative before:content-['→'] before:absolute before:left-0 before:text-corpse"
						>
							Priority support
						</li>
					</ul>
					<p class="text-corpse text-sm leading-normal">
						5-10 hours saved per project.<br />
						Link repo → Get docpack → Done.
					</p>
				</div>
			</div>
			<p
				class="text-lg md:text-xl text-echo leading-relaxed mb-6 pt-8 border-t border-ash"
			>
				<strong class="text-whisper"
					>You're not paying for hosting.</strong
				><br />
				You're paying for an AI agent that reads your codebase and generates
				production-ready documentation automatically. No more manual doc
				writing. No more copy-pasting between formats. Link your repo, allocate
				tokens, publish in minutes.
			</p>

			<p
				class="text-lg md:text-xl text-echo leading-relaxed pt-8 border-t border-ash"
			>
				<strong class="text-whisper">Like npm. For docs.</strong><br />
				Anyone can install for free. Only creators pay—and they get automation
				that makes it worth every cent. Your docs become instantly installable
				by thousands of devs worldwide. That's just the bonus.
			</p>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="py-16 md:py-20 text-center border-t border-fog">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<h2 class="text-3xl md:text-5xl font-normal mb-8 tracking-tight text-whisper">
				Stop the bleeding.
			</h2>
			<div
				class="rounded border border-ash px-4 py-4 md:px-8 md:py-8 text-sm md:text-base leading-relaxed mb-6 overflow-x-auto max-w-[500px] mx-auto text-left"
			>
				<div class="text-whisper whitespace-nowrap">
					$ cargo install localdoc
				</div>
			</div>
			<p class="text-base text-shadow leading-relaxed">
				Documentation for people who actually build things.
			</p>
		</div>
	</section>

	<!-- Footer -->
	<section class="py-16 md:py-20 text-center border-t border-ash">
		<div class="max-w-[900px] mx-auto px-6 md:px-16">
			<p class="text-sm text-shadow mb-3">
				Built by <a
					href="https://github.com/xandwr"
					target="_blank"
					rel="noopener noreferrer"
					class="text-corpse hover:text-whisper transition-colors"
					>crazy</a
				> to keep others sane.
			</p>
			<p class="flex items-center justify-center gap-3 text-sm">
				<a
					href="https://github.com/xandwr/doctown-monorepo"
					target="_blank"
					rel="noopener"
					class="text-echo hover:text-whisper transition-colors no-underline"
					>GitHub</a
				>
				<span class="text-static">•</span>
				<a
					href="https://discord.gg/r8rbntTaKQ"
					target="_blank"
					rel="noopener"
					class="text-echo hover:text-whisper transition-colors no-underline"
					>Discord</a
				>
			</p>
		</div>
	</section>
</main>
