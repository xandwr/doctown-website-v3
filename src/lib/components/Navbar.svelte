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
    class="py-2 px-4 md:px-8 flex items-center justify-between border-b border-border-default relative"
>
    <!-- Left side: Logo and Desktop Navigation -->
    <div class="flex items-center gap-x-8">
        <a
            href="/"
            class="text-3xl md:text-4xl font-light text-text-primary hover:text-white z-10"
            >doctown</a
        >

        <!-- Desktop Navigation - Hidden on mobile -->
        <div class="hidden md:flex items-center gap-x-8">
            <div class="border-r border-border-default h-8"></div>
            <nav class="flex items-center gap-x-6 text-lg text-text-secondary">
                <a
                    href="/commons"
                    class="hover:text-text-primary transition-colors"
                    class:text-primary={$page.url.pathname === "/commons"}
                >
                    Commons
                </a>
                {#if user}
                    <a
                        href="/dashboard"
                        class="hover:text-text-primary transition-colors"
                        class:text-primary={$page.url.pathname ===
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
                        class="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border-strong rounded-sm overflow-hidden z-50"
                    >
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block px-4 py-2 hover:bg-border-strong transition-colors text-text-primary"
                        >
                            GitHub Profile
                        </a>
                        <button
                            onclick={handleLogout}
                            class="w-full text-left px-4 py-2 hover:bg-danger/30 transition-colors text-danger"
                        >
                            Logout
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <a
                href="/auth/login"
                class="bg-bg-elevated border border-border-strong rounded-sm p-2 text-text-primary hover:bg-border-strong transition-colors"
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
            class="p-2 hover:bg-bg-elevated transition-colors text-text-primary"
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
                class="absolute right-0 mt-2 w-64 bg-bg-elevated border border-border-strong rounded-sm overflow-hidden z-50"
            >
                <nav class="flex flex-col text-text-primary">
                    <a
                        href="/commons"
                        class="px-4 py-3 hover:bg-border-strong transition-colors border-b border-border-strong"
                        class:text-primary={$page.url.pathname === "/commons"}
                        onclick={() => (showMobileMenu = false)}
                    >
                        Commons
                    </a>
                    {#if user}
                        <a
                            href="/dashboard"
                            class="px-4 py-3 hover:bg-border-strong transition-colors border-b border-border-strong"
                            class:text-primary={$page.url.pathname ===
                                "/dashboard"}
                            onclick={() => (showMobileMenu = false)}
                        >
                            Dashboard
                        </a>
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="px-4 py-3 hover:bg-border-strong transition-colors border-b border-border-strong flex items-center gap-2"
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
                            class="w-full text-left px-4 py-3 hover:bg-danger/30 transition-colors text-danger"
                        >
                            Logout
                        </button>
                    {:else}
                        <a
                            href="/auth/login"
                            class="mx-4 my-3 bg-border-strong border border-border-default rounded-sm p-2 text-text-primary hover:bg-border-default transition-colors text-center"
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
