<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useI18n } from '@open-pencil/vue/i18n'

import { toast } from '@/app/shell/ui'
import { importFromFiles } from '@/app/skills/import'
import { deleteSkill, listSkills, setSkillEnabled, type SkillRecord } from '@/app/skills/store'
import SettingsSection from '@/components/settings/layout/SettingsSection.vue'
import AppButton from '@/components/ui/button/AppButton.vue'
import IconButton from '@/components/ui/button/IconButton.vue'
import { AppConfirmationDialog } from '@/components/ui/dialog'
import AppActionRow from '@/components/ui/list/AppActionRow.vue'
import { useHeldContent } from '@/components/ui/overlay/held'

const { ai, common } = useI18n()

const skills = ref<SkillRecord[]>([])
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()
const folderInput = ref<HTMLInputElement>()
const pendingDelete = ref<SkillRecord>()
// Confirming clears the record; the dialog keeps showing the skill while it animates closed.
const deleting = useHeldContent(pendingDelete)

async function refresh(): Promise<void> {
  skills.value = await listSkills()
}
onMounted(() => void refresh())

/** Imports any picked batch: .zip archives go whole, markdown files and folders by their tree. */
async function importPicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return
  await runImport(() => importFromFiles(files))
}

async function runImport(imported: () => Promise<number>): Promise<void> {
  importing.value = true
  try {
    await imported()
    await refresh()
  } catch (error) {
    // The toast stays generic; the console carries the underlying cause.
    console.error(error)
    toast.error(ai.value.importSkillFailed)
  } finally {
    importing.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const record = pendingDelete.value
  if (!record) return
  pendingDelete.value = undefined
  await deleteSkill(record.id)
  await refresh()
}

async function toggleSkill(record: SkillRecord): Promise<void> {
  await setSkillEnabled(record.id, record.enabled === false)
  await refresh()
}

/** Closing the dialog without confirming just clears the pending delete. */
function dismissDelete(open?: boolean): void {
  if (!open) pendingDelete.value = undefined
}
</script>

<template>
  <SettingsSection>
    <template #title>{{ ai.skillsTitle }}</template>
    <template #description>{{ ai.skillsDescription }}</template>
    <template #actions>
      <div class="flex items-center gap-1.5">
        <AppButton
          :disabled="importing"
          data-test-id="settings-skill-import-file"
          @click="fileInput?.click()"
        >
          <template #leading><icon-lucide-file-up class="size-3" /></template>
          {{ ai.importSkillFile }}
        </AppButton>
        <AppButton
          :disabled="importing"
          data-test-id="settings-skill-import-folder"
          @click="folderInput?.click()"
        >
          <template #leading><icon-lucide-folder-up class="size-3" /></template>
          {{ ai.importSkillFolder }}
        </AppButton>
      </div>
    </template>

    <!-- Hidden pickers: a folder upload keeps relative paths, so the tree imports as SKILL.md + refs. -->
    <input
      ref="fileInput"
      type="file"
      accept=".zip,.md"
      multiple
      class="hidden"
      data-test-id="settings-skill-file-input"
      @change="importPicked"
    />
    <input
      ref="folderInput"
      type="file"
      webkitdirectory
      class="hidden"
      data-test-id="settings-skill-folder-input"
      @change="importPicked"
    />

    <div class="flex flex-col gap-1.5" data-test-id="settings-skill-list">
      <AppActionRow
        v-for="skill in skills"
        :key="skill.id"
        :data-skill-id="skill.id"
        :ui="{ root: 'py-3', label: 'text-xs', description: 'text-[11px] leading-relaxed' }"
      >
        <template #default>{{ skill.name }}</template>
        <template #description>
          {{ skill.description ?? `/skill:${skill.id}` }}
          <span v-if="skill.refs && Object.keys(skill.refs).length > 0" class="ms-1 text-muted">
            · {{ ai.skillReferences({ count: Object.keys(skill.refs).length }) }}
          </span>
        </template>
        <template #trailing>
          <span class="text-[10px] uppercase tracking-wide text-muted">{{ skill.source }}</span>
          <IconButton
            :label="skill.enabled === false ? ai.skillToggle : ai.skillToggleHidden"
            :active="skill.enabled !== false"
            toggle
            size="sm"
            class="opacity-70 hover:opacity-100"
            data-test-id="settings-skill-toggle"
            @click="toggleSkill(skill)"
          >
            <icon-lucide-eye v-if="skill.enabled !== false" class="size-3" />
            <icon-lucide-eye-off v-else class="size-3" />
          </IconButton>
          <IconButton
            v-if="skill.source !== 'builtin'"
            :label="ai.deleteSkill"
            size="sm"
            data-test-id="settings-skill-delete"
            @click="pendingDelete = skill"
          >
            <icon-lucide-trash-2 class="size-3" />
          </IconButton>
        </template>
      </AppActionRow>
    </div>

    <AppConfirmationDialog
      :open="pendingDelete !== undefined"
      :heading="ai.deleteSkillConfirmation({ name: deleting?.name ?? '' })"
      :description="ai.deleteSkillDescription"
      :cancel-label="common.cancel"
      :confirm-label="ai.deleteSkill"
      tone="danger"
      data-test-id="settings-skill-delete-confirm"
      @update:open="dismissDelete"
      @confirm="confirmDelete"
    />
  </SettingsSection>
</template>
