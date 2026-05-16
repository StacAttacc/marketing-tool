<script setup lang="ts">
import EsInputsBudget from '~/components/es/inputs/budget.vue'
import EsInputsCampaign from '~/components/es/inputs/campaign.vue'
import EsInputsSpend from '~/components/es/inputs/spend.vue'
import EsInputsResults from '~/components/es/inputs/results.vue'

definePageMeta({
  layout: 'default',
})

const tabs = [
  { label: 'Budgets', component: EsInputsBudget },
  { label: 'Campaigns', component: EsInputsCampaign },
  { label: 'Spend', component: EsInputsSpend },
  { label: 'Results', component: EsInputsResults },
]
</script>

<template>
  <div class="px-4">
    <EsInputsTabbedContainer :tabs="tabs" />
  </div>
</template>
