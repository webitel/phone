import Vue from "vue"
import Vuetify from "vuetify/lib"
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    dark: false,
  },
  themes: {
    light: {
      primary: "#4682b4",
      secondary: "#b0bec5",
      accent: "#8c9eff",
      error: "#b71c1c",
    },
  },
})

/*
    primary: '#82B1FF',
    // primary: '#142dbf',
    secondary: '#424242',
    accent: '#387E75',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107'
 */
