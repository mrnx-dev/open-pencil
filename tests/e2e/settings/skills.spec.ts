import { expect, test, type Page } from '@playwright/test'

import { CanvasHelper } from '#tests/helpers/canvas'

async function openSettings(page: Page) {
  await page.goto('/?test')
  await new CanvasHelper(page).waitForInit()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+,' : 'Control+,')
  await page.getByTestId('settings-section-ai').click()
}

test('the skills section lists the bundled skill without a delete button', async ({ page }) => {
  await openSettings(page)
  const list = page.getByTestId('settings-skill-list')
  const designer = list.locator('[data-skill-id="designer"]')
  await expect(designer).toBeVisible()
  await expect(designer.getByTestId('settings-skill-delete')).toHaveCount(0)
  await expect(designer.getByTestId('settings-skill-toggle')).toBeVisible()
})

test('importing a markdown skill folder adds the skill with its references', async ({ page }) => {
  await openSettings(page)
  // The tree import needs relative paths, so the two fixture files arrive as one
  // folder pick through a DataTransfer FileList built in the page.
  await page.evaluate(
    async (paths) => {
      const transfer = new DataTransfer()
      for (const [index, path] of paths.entries()) {
        const response = await fetch(path)
        const relative = index === 0 ? 'notes-organizer/SKILL.md' : 'notes-organizer/organizing.md'
        const file = new File([await response.blob()], relative.split('/').at(-1) ?? relative)
        Object.defineProperty(file, 'webkitRelativePath', { value: relative })
        transfer.items.add(file)
      }
      const input = document.querySelector<HTMLInputElement>(
        '[data-test-id="settings-skill-file-input"]'
      )
      if (!input) throw new Error('Missing skill file input')
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    [
      'tests/fixtures/skills/notes-organizer/SKILL.md',
      'tests/fixtures/skills/notes-organizer/organizing.md'
    ]
  )
  const row = page.getByTestId('settings-skill-list').locator('[data-skill-id="notes-organizer"]')
  await expect(row).toBeVisible()
  // The sibling .md fixture file becomes the skill's only reference.
  await expect(row).toContainText('1 reference files')
  await expect(row.getByTestId('settings-skill-delete')).toBeVisible()
})

test('deleting an imported skill removes it from the list and the composer autocomplete', async ({
  page
}) => {
  await openSettings(page)
  await page.evaluate(
    async (paths) => {
      const transfer = new DataTransfer()
      for (const [index, path] of paths.entries()) {
        const response = await fetch(path)
        const relative = index === 0 ? 'notes-organizer/SKILL.md' : 'notes-organizer/organizing.md'
        const file = new File([await response.blob()], relative.split('/').at(-1) ?? relative)
        Object.defineProperty(file, 'webkitRelativePath', { value: relative })
        transfer.items.add(file)
      }
      const input = document.querySelector<HTMLInputElement>(
        '[data-test-id="settings-skill-file-input"]'
      )
      if (!input) throw new Error('Missing skill file input')
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    [
      'tests/fixtures/skills/notes-organizer/SKILL.md',
      'tests/fixtures/skills/notes-organizer/organizing.md'
    ]
  )
  const row = page.getByTestId('settings-skill-list').locator('[data-skill-id="notes-organizer"]')
  await expect(row).toBeVisible()

  await row.getByTestId('settings-skill-delete').click()
  const dialog = page.getByTestId('settings-skill-delete-confirm')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Delete skill', exact: true }).click()
  await expect(row).toHaveCount(0)

  await page.getByTestId('app-settings-done').click()
  await page.getByTestId('properties-tab-ai').click()
  await expect(page.getByRole('tab', { name: 'AI' })).toHaveAttribute('data-state', 'active')
  // The composer only mounts once a provider is configured (ProviderSetup otherwise).
  await page.getByTestId('provider-setup-open-settings').click()
  await page.locator('[data-model-id]').first().click()
  await page.getByTestId('settings-model-provider').click()
  await page.getByRole('option', { name: 'OpenRouter' }).click()
  await page.getByRole('textbox', { name: 'Name' }).fill('Claude Sonnet')
  await page.getByTestId('provider-settings-api-key').fill('sk-or-test-key-12345')
  await page.getByRole('button', { name: 'Save model', exact: true }).click()
  await page.getByTestId('app-settings-done').click()
  await page.getByRole('textbox', { name: 'Describe a change' }).click()
  await page.getByRole('textbox', { name: 'Describe a change' }).type('/')
  await expect(page.getByRole('option', { name: '/skill:notes-organizer' })).toHaveCount(0)
  await expect(page.getByRole('option', { name: '/skill:designer' })).toBeVisible()
})
