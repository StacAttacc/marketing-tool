<template>
  <div class="drawer lg:drawer-open">
    <input
      id="main-drawer"
      type="checkbox"
      class="drawer-toggle"
    >
    <div class="drawer-content flex flex-col">
      <EsNavBar />
      <main class="flex-1 bg-base-100 text-prometheus-orange p-4">
        <slot />
      </main>
    </div>

    <div class="drawer-side is-drawer-close:overflow-visible">
      <label
        for="main-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      />
      <EsSideBar />
    </div>
  </div>
</template>
