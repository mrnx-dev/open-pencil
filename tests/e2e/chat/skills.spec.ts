import { readFile } from 'node:fs/promises'

import { expect, test } from '#tests/helpers/chat/fixture'
import { repoPath } from '#tests/helpers/paths'

test('typing / suggests skills and the chip injects the SKILL.md content', async ({
  configuredChat: chat
}) => {
  const skillContent = await readFile(repoPath('src/app/skills/built-in/designer/SKILL.md'), 'utf8')

  await chat.input.click()
  await chat.input.type('/')
  const listbox = chat.page.getByRole('listbox', { name: 'Skills 1' })
  await expect(listbox).toBeVisible()
  await listbox.getByRole('option', { name: '/skill:designer' }).click()
  await expect(chat.input).toHaveText('/skill:designer ')

  await chat.input.type('Make a landing page')
  await chat.input.press('Enter')

  await expect
    .poll(async () => chat.page.getAttribute('html', 'data-last-chat-request'))
    .toContain(skillContent.trim())
})

test('hiding a skill removes it from the autocomplete until it is shown again', async ({
  configuredChat: chat
}) => {
  const designerRow = () =>
    chat.page.getByTestId('settings-skill-list').locator('[data-skill-id="designer"]')
  const hide = () => designerRow().getByTestId('settings-skill-toggle')

  // A second '/' in plain text (no space before it) stops the slash query, so clear first.
  const typeSlash = async () => {
    await chat.input.fill('')
    await chat.input.click()
    await expect(chat.input).toBeFocused()
    await chat.input.pressSequentially('/')
    return chat.page.getByRole('listbox', { name: 'Skills 1' })
  }

  // Settings > AI > Skills: hide the bundled designer skill.
  await chat.page.getByTestId('app-settings-trigger').click()
  await chat.page.getByTestId('settings-section-ai').click()
  await hide().click()
  // The eye flips immediately: the toggle reflects the stored state without a reopen.
  await expect(hide()).toHaveAttribute('data-state', 'off')
  await chat.page.getByTestId('app-settings-done').click()
  await expect(chat.page.getByTestId('app-settings-dialog')).toBeHidden()

  const hiddenBox = await typeSlash()
  await expect(chat.input).toHaveText('/')
  await expect(chat.page.getByRole('option', { name: '/skill:designer' })).toHaveCount(0)
  await expect(hiddenBox).toHaveCount(0)

  await chat.page.getByTestId('app-settings-trigger').click()
  await chat.page.getByTestId('settings-section-ai').click()
  await hide().click()
  await expect(hide()).toHaveAttribute('data-state', 'on')
  await chat.page.getByTestId('app-settings-done').click()
  await expect(chat.page.getByTestId('app-settings-dialog')).toBeHidden()

  const listbox = await typeSlash()
  await expect(listbox.getByRole('option', { name: '/skill:designer' })).toBeVisible()
})
