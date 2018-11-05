<template>
  <v-dialog :value="showDialog" persistent max-width="390">
    <v-card>
      <v-card-title class="headline">Authentication</v-card-title>
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field
            label="Login"
            :rules="loginRules"
            v-model="login"
            type="text"
            required
          ></v-text-field>
          <v-text-field
            v-model="password"
            type="password"
            label="Password"
          ></v-text-field>
          <v-btn :disabled="!valid" block outline large color="success" @click="auth()">
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
    export default {
      name: "AuthenticationDialog",
      data() {
        return {
          valid: false,
          login: null,
          loginRules: [
            v => !!v || 'Login is required'
          ],
          password: null,
          show: false
        }
      },
      computed: {
        showDialog() {
          return this.$store.getters['authentication/request']
        }
      },
      watch: {
        showDialog() {
          this.login = null;
          this.password = null;
        }
      },
      methods: {
        auth() {
          this.$store.commit('authentication/CLOSE_REQUEST', {
            login: this.login,
            password: this.password
          })
        }
      }
    }
</script>

<style scoped>

</style>
