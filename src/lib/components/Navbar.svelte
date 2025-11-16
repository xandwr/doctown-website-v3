<script lang="ts">
    import { page } from "$app/stores";

    let showDropdown = $state(false);
    let showMobileMenu = $state(false);
    let dropdownRef = $state<HTMLDivElement>();
    let mobileMenuButtonRef = $state<HTMLButtonElement>();
    let mobileMenuDropdownRef = $state<HTMLDivElement>();

    const user = $derived($page.data.user);

    function toggleDropdown(event: Event) {
        event.stopPropagation();
        showDropdown = !showDropdown;
    }

    function toggleMobileMenu(event: Event) {
        event.stopPropagation();
        showMobileMenu = !showMobileMenu;
    }

    function closeDropdown(event: MouseEvent) {
        const target = event.target as Node;

        if (dropdownRef && !dropdownRef.contains(target)) {
            showDropdown = false;
        }

        if (
            mobileMenuButtonRef &&
            mobileMenuDropdownRef &&
            !mobileMenuButtonRef.contains(target) &&
            !mobileMenuDropdownRef.contains(target)
        ) {
            showMobileMenu = false;
        }
    }

    async function handleLogout() {
        await fetch("/auth/logout", {
            method: "POST",
        });
        window.location.href = "/";
    }
</script>

<svelte:window onclick={closeDropdown} />

<div
    class="py-2 px-4 md:px-8 flex items-center justify-between border-b border-white/20 relative"
>
    <!-- Left side: Logo and Desktop Navigation -->
    <div class="flex items-center gap-x-8">
        <a
            href="/"
            class="text-3xl md:text-4xl font-light hover:opacity-80 z-10"
            >doctown</a
        >

        <!-- Desktop Navigation - Hidden on mobile -->
        <div class="hidden md:flex items-center gap-x-8">
            <div class="border-r border-white/20 h-8"></div>
            <nav class="flex items-center gap-x-6 text-lg">
                <a
                    href="/commons"
                    class="hover:text-cyan-400 transition-colors"
                    class:text-cyan-400={$page.url.pathname === "/commons"}
                >
                    Commons
                </a>
                {#if user}
                    <a
                        href="/dashboard"
                        class="hover:text-emerald-400 transition-colors"
                        class:text-emerald-400={$page.url.pathname ===
                            "/dashboard"}
                    >
                        Dashboard
                    </a>
                {/if}
            </nav>
        </div>
    </div>

    <!-- Desktop Auth - Hidden on mobile -->
    <div class="hidden md:block text-lg">
        {#if user}
            <div class="relative" bind:this={dropdownRef}>
                <button
                    onclick={toggleDropdown}
                    class="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                        class="w-8 h-8 rounded-full"
                    />
                    <span>{user.name || user.login}</span>
                </button>

                {#if showDropdown}
                    <div
                        class="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/20 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block px-4 py-2 hover:bg-white/10 transition-colors"
                        >
                            GitHub Profile
                        </a>
                        <button
                            onclick={handleLogout}
                            class="w-full text-left px-4 py-2 hover:bg-red-500/20 transition-colors text-red-400"
                        >
                            Logout
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <a
                href="/auth/login"
                class="bg-white p-2 rounded-xl text-black hover:bg-white/90 transition-colors"
            >
                Login with GitHub
            </a>
        {/if}
    </div>

    <!-- Mobile Hamburger Button - Only visible on mobile -->
    <div class="md:hidden relative">
        <button
            bind:this={mobileMenuButtonRef}
            onclick={toggleMobileMenu}
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                {#if showMobileMenu}
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                {:else}
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                {/if}
            </svg>
        </button>

        <!-- Mobile Menu Dropdown -->
        {#if showMobileMenu}
            <div
                bind:this={mobileMenuDropdownRef}
                class="absolute right-0 mt-2 w-64 bg-zinc-900 border border-white/20 rounded-lg shadow-lg overflow-hidden z-50"
            >
                <nav class="flex flex-col">
                    <a
                        href="/commons"
                        class="px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                        class:text-cyan-400={$page.url.pathname === "/commons"}
                        onclick={() => (showMobileMenu = false)}
                    >
                        Commons
                    </a>
                    {#if user}
                        <a
                            href="/dashboard"
                            class="px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10"
                            class:text-emerald-400={$page.url.pathname ===
                                "/dashboard"}
                            onclick={() => (showMobileMenu = false)}
                        >
                            Dashboard
                        </a>
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 flex items-center gap-2"
                        >
                            <img
                                src={user.avatar_url}
                                alt={user.login}
                                class="w-6 h-6 rounded-full"
                            />
                            <span>GitHub Profile</span>
                        </a>
                        <button
                            onclick={handleLogout}
                            class="w-full text-left px-4 py-3 hover:bg-red-500/20 transition-colors text-red-400"
                        >
                            Logout
                        </button>
                    {:else}
                        <a
                            href="/auth/login"
                            class="mx-4 my-3 bg-white p-2 rounded-xl text-black hover:bg-white/90 transition-colors text-center"
                            onclick={() => (showMobileMenu = false)}
                        >
                            Login with GitHub
                        </a>
                    {/if}
                </nav>
            </div>
        {/if}
    </div>
</div>
