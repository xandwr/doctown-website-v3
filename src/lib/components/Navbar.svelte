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
    class="py-2 px-4 md:px-8 flex items-center justify-between border-b border-fog relative"
>
    <!-- Left side: Logo and Desktop Navigation -->
    <div class="flex items-center gap-x-8">
        <a
            href="/"
            class="text-3xl md:text-4xl font-light text-whisper hover:text-white z-10"
            >doctown</a
        >

        <!-- Desktop Navigation - Hidden on mobile -->
        <div class="hidden md:flex items-center gap-x-8">
            <div class="border-r border-fog h-8"></div>
            <nav class="flex items-center gap-x-6 text-lg text-echo">
                <a
                    href="/commons"
                    class="hover:text-whisper transition-colors"
                    class:text-corpse={$page.url.pathname === "/commons"}
                >
                    Commons
                </a>
                {#if user}
                    <a
                        href="/dashboard"
                        class="hover:text-whisper transition-colors"
                        class:text-corpse={$page.url.pathname ===
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
                        class="absolute right-0 mt-2 w-48 bg-fog border border-ash rounded-sm overflow-hidden z-50"
                    >
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block px-4 py-2 hover:bg-ash transition-colors text-whisper"
                        >
                            GitHub Profile
                        </a>
                        <button
                            onclick={handleLogout}
                            class="w-full text-left px-4 py-2 hover:bg-decay/30 transition-colors text-decay"
                        >
                            Logout
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <a
                href="/auth/login"
                class="bg-fog border border-ash rounded-sm p-2 text-whisper hover:bg-ash transition-colors"
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
            class="p-2 hover:bg-fog transition-colors text-whisper"
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
                class="absolute right-0 mt-2 w-64 bg-fog border border-ash rounded-sm overflow-hidden z-50"
            >
                <nav class="flex flex-col text-whisper">
                    <a
                        href="/commons"
                        class="px-4 py-3 hover:bg-ash transition-colors border-b border-ash"
                        class:text-corpse={$page.url.pathname === "/commons"}
                        onclick={() => (showMobileMenu = false)}
                    >
                        Commons
                    </a>
                    {#if user}
                        <a
                            href="/dashboard"
                            class="px-4 py-3 hover:bg-ash transition-colors border-b border-ash"
                            class:text-corpse={$page.url.pathname ===
                                "/dashboard"}
                            onclick={() => (showMobileMenu = false)}
                        >
                            Dashboard
                        </a>
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="px-4 py-3 hover:bg-ash transition-colors border-b border-ash flex items-center gap-2"
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
                            class="w-full text-left px-4 py-3 hover:bg-decay/30 transition-colors text-decay"
                        >
                            Logout
                        </button>
                    {:else}
                        <a
                            href="/auth/login"
                            class="mx-4 my-3 bg-ash border border-dust rounded-sm p-2 text-whisper hover:bg-dust transition-colors text-center"
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
