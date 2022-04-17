import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/react'
import Loading from '../components/Loading'

test('renders content', () => {
  const component = render(
    <Loading />
  )

  expect(component.container).toHaveTextContent(
    'Loading...'
  )
})