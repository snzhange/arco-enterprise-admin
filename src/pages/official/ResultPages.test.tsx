import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ErrorResultPage, SuccessResultPage } from './ResultPages'

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

describe('resultPages', () => {
  it('navigates from success result to list', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/result/success']}>
        <SuccessResultPage />
        <LocationProbe />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '返回项目列表' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/list/search-table')
  })

  it('navigates from error result back to editing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/result/error']}>
        <ErrorResultPage />
        <LocationProbe />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '返回修改' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/form/group')
  })
})
