import AppRouter from "./Router/AppRouter"
import { store } from "./Store"
import { Provider } from 'react-redux';
import './Styles/global.css'


function App() {
  return (
    <Provider store={store}>
      <AppRouter/>
    </Provider>
  )
}
export default App