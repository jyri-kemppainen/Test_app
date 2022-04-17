import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/react'
import PlacesList from '../components/PlacesList'
let places;

beforeEach(() => {
    places = [
      {
        "ID":1, "Name":"favorite beach",
        "UserID":1, "Latitude":62.6126,
        "Longitude":29.696, "UserName":"Radu"
      }, {
        "ID":2, "Name":"favorite pizza place",
        "UserID":2, "Latitude":62.6009,
        "Longitude":29.7598, "UserName":"Jyri"
      }
    ]
})

test('renders content', () => {
      const component = render(
        <PlacesList places={places}/>
      )
      expect(component.container).toHaveTextContent(
        "favorite beach"
      )
      const div = component.container.querySelector('#place_2')
      expect(div).toHaveTextContent(
        "2. Jyri"
      )
      //  component.debug()
})
