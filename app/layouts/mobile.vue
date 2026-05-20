<template>
  <div class="flex flex-col min-h-screen">
    <EsNavBar />
    <main class="flex-1 bg-base-100 text-prometheus-orange p-4 pb-20">
      <slot />
    </main>
    <EsBottomNav />
  </div>
</template>
