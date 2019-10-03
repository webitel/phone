<template>

  <v-layout row v-if="call">
    <v-flex xs12 sm6 offset-sm3>
      <div>

        <v-card >
          <v-card-title >
            <v-layout row>
              <v-flex xs2 class="text-xs-left">
                <h5>{{call.state ? $t('call.' + call.state.toLowerCase()) : ''}}</h5>
              </v-flex>
              <v-flex xs8 class="text-xs-center">
                <v-tooltip v-model="showTooltipCopy" top nudge-top="0">
                  <h2 slot="activator" @click="copyClipboard(call.number)" class="copy-to-clipboard text-xs-center text-truncate">{{call.name}}</h2>
                  <span>{{$t('call.copied')}}</span>
                </v-tooltip>
              </v-flex>
              <v-flex xs2 class="text-xs-right">
                <h5>
                  <v-icon v-if="call.direction === 'inbound'">call_received</v-icon>
                  <v-icon v-else>call_made</v-icon>
                </h5>
              </v-flex>
            </v-layout>
            <p @click="copyClipboard(call.number)" class="copy-to-clipboard .display-1 text-xs-center">{{call.number}}</p>

            <p style="width: 100%" class="text-xs-center">
              <Countdown :start="call.answeredAt" :end="call.hangupAt"></Countdown>
            </p>
          </v-card-title>

          <v-responsive >
            <v-layout column class="media">
              <v-card-title>
                <v-menu
                  :open-on-click="false"
                  v-model="dtmfPanel"
                  offset-x
                  :close-on-content-click="false"
                >
                  <v-btn :disabled="!call.isActive()" small icon class="mr-3" @click="dtmfPanel = call.isActive()" slot="activator">
                    <v-icon>dialpad</v-icon>
                  </v-btn>

                  <v-card>
                    <v-list>
                      <v-list-tile>
                        <v-flex column>
                          <v-btn @click="call.dtmf('1')" outline icon>1</v-btn>
                          <v-btn @click="call.dtmf('2')" outline icon>2</v-btn>
                          <v-btn @click="call.dtmf('3')" outline icon>3</v-btn>
                        </v-flex>
                      </v-list-tile>
                      <v-list-tile>
                        <v-flex column>
                          <v-btn @click="call.dtmf('4')" outline icon>4</v-btn>
                          <v-btn @click="call.dtmf('5')" outline icon>5</v-btn>
                          <v-btn @click="call.dtmf('6')" outline icon>6</v-btn>
                        </v-flex>
                      </v-list-tile>
                      <v-list-tile>
                        <v-flex column>
                          <v-btn @click="call.dtmf('7')" outline icon>7</v-btn>
                          <v-btn @click="call.dtmf('8')" outline icon>8</v-btn>
                          <v-btn @click="call.dtmf('9')" outline icon>9</v-btn>
                        </v-flex>
                      </v-list-tile>
                      <v-list-tile>
                        <v-flex column>
                          <v-btn @click="call.dtmf('*')" outline icon>*</v-btn>
                          <v-btn @click="call.dtmf('0')" outline icon>0</v-btn>
                          <v-btn @click="call.dtmf('#')" outline icon>#</v-btn>
                        </v-flex>
                      </v-list-tile>
                    </v-list>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn  @click="dtmfPanel = false" icon class="mr-3">
                        <v-icon>close</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>

                <v-menu
                  :open-on-click="false"
                  v-model="transferPanel"
                  offset-x
                  :close-on-content-click="false"
                >
                  <v-btn :disabled="!call.isActive()" small icon class="mr-3" @click="transferPanel = call.isActive()" slot="activator">
                    <v-icon>call_missed_outgoing</v-icon>
                  </v-btn>
                  <v-card>
                    <v-card-text>
                      <v-layout align-center>
                        <v-text-field v-model="blindTransferNumber" :label="$t('call.blindTransferNumber')"></v-text-field>
                        <v-btn :disabled="!blindTransferNumber" @click="call.blindTransfer(blindTransferNumber); transferPanel = false" icon small>
                          <v-icon :color="blindTransferNumber ? 'success': ''">swap_horiz</v-icon>
                        </v-btn>
                      </v-layout>
                    </v-card-text>

                    <v-list two-line v-if="otherCalls.length > 0">
                      <template v-for="(item, i) in otherCalls" v-if="item">
                        <v-list-tile
                          ripple
                        >
                          <v-list-tile-content>
                            <v-list-tile-title>{{ item.getName() }}</v-list-tile-title>
                          </v-list-tile-content>
                          <v-list-tile-action>
                            <v-btn small icon @click="call.attendedTransfer(item)">
                              <v-icon color="success">call</v-icon>
                            </v-btn>
                          </v-list-tile-action>
                        </v-list-tile>
                      </template>
                    </v-list>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn  @click="transferPanel = false" icon class="mr-3">
                        <v-icon>close</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>

                <v-btn @click="call.answer()" icon class="mr-3" v-if="call.direction === 'inbound' && call.state === 'RINGING' && user.webPhoneRegister">
                  <v-icon color="success">call</v-icon>
                </v-btn>

                <v-btn @click="call.toggleHold()" icon class="mr-3" v-else-if="call.state === 'ACTIVE' || call.state === 'HOLD'">
                  <v-icon :color="call.state === 'HOLD' ? 'warning': ''">phone_paused</v-icon>
                </v-btn>

                <v-btn :loading="call.requestPostProcess"  :disabled="call.requestPostProcess" id="btn-postprocess" @click="sendPostProcess()" icon class="mr-3" v-else-if="call.state === 'DOWN'">
                  <v-icon color="success">check</v-icon>
                  <span slot="loader" class="custom-loader">
                    <v-icon light>cached</v-icon>
                  </span>
                </v-btn>

                <v-spacer></v-spacer>

                <v-btn :disabled="!call.isActive()" @click="call.hangup()" icon class="mr-3">
                  <v-icon  color="error">call_end</v-icon>
                </v-btn>

              </v-card-title>

              <v-card-text>
                <v-expansion-panel expand v-model="panel">
                  <v-expansion-panel-content key="0" v-show="call.info.length > 0">
                    <div slot="header">{{$t('call.infoPanel')}}</div>

                    <v-card flat color="transparent" >
                      <v-card-text align-content-start>
                        <v-flex>
                          <div class="call-info-row text--accent-1" v-for="(item, index) in call.info">
                            <vue-markdown :breaks="true" class="call-info-item" :anchor-attributes="anchorAttrs">**{{item.title}}**: {{item.content}}</vue-markdown>
                          </div>
                        </v-flex>
                      </v-card-text>
                    </v-card>

                  </v-expansion-panel-content>

                  <v-expansion-panel-content key="1" @keyup.native.enter="call.state === 'DOWN' && sendPostProcess()" v-if="call.postProcessing && call.dbUuid && call.bridgedAt && call.infoProtectedVariables.dlr_id">
                    <div slot="header">{{$t('call.postProcessPanel')}}
                      <countdownWrap @countdownend="() => call.destroy()" :leading-zero="true" v-if="call.state === 'DOWN' && call.infoProtectedVariables.dlr_wrap > 0"  :time="call.infoProtectedVariables.dlr_wrap * 1000">
                        <template slot-scope="props">{{ props.minutes }}:{{ props.seconds }}</template>
                      </countdownWrap>
                    </div>

                    <v-card flat color="transparent" >
                      <v-card-text align-content-start>
                        <v-flex>
                          <v-checkbox
                            :label="$t('call.dlrSuccessCall')"
                            v-model="successCall"
                          ></v-checkbox>
                        </v-flex>

                        <div v-show="!successCall">

                          <v-flex>
                            <v-checkbox
                              :label="$t('call.dlrScheduleCall')"
                              v-model="nextAfterEnabled"
                              width="100px"
                            ></v-checkbox>
                          </v-flex>

                          <v-layout row v-show="nextAfterEnabled">
                            <v-flex xs6>
                              <v-dialog
                                content-class="fix-datetime-picker"
                                ref="dialogTime"
                                v-model="modalTime"
                                :return-value.sync="nextAfterTime"
                                persistent
                                lazy
                                full-width
                                max-width="290px"
                                min-width="290px"
                              >
                                <v-text-field
                                  slot="activator"
                                  :required="nextAfterEnabled"
                                  v-model="nextAfterTime"
                                  :label="$t('call.dlrNextAfterTime')"
                                  clearable
                                  readonly
                                  prepend-icon="access_time"
                                ></v-text-field>
                                <v-time-picker v-model="nextAfterTime" actions format="24hr">
                                  <v-spacer></v-spacer>
                                  <v-btn flat color="primary" @click="modalTime = false">{{$t('app.cancel')}}</v-btn>
                                  <v-btn flat color="primary" @click="$refs.dialogTime.save(nextAfterTime)">{{$t('app.ok')}}</v-btn>
                                </v-time-picker>
                              </v-dialog>
                            </v-flex>
                            <v-flex xs6>
                              <v-dialog
                                content-class="fix-datetime-picker"
                                ref="dialogDate"
                                v-model="modalDate"
                                :return-value.sync="nextAfterDate"
                                persistent
                                lazy
                                full-width
                                disabled
                                width="290px"
                              >
                                <v-text-field
                                  slot="activator"
                                  :required="nextAfterEnabled"
                                  v-model="nextAfterDate"
                                  label="Date"
                                  disabled
                                  clearable
                                  readonly
                                  prepend-icon="event"
                                ></v-text-field>
                                <v-date-picker v-model="nextAfterDate" scrollable :allowed-dates="allowedDates">
                                  <v-spacer></v-spacer>
                                  <v-btn flat color="primary" @click="modalDate = false">{{$t('app.cancel')}}</v-btn>
                                  <v-btn flat color="primary" @click="$refs.dialogDate.save(nextAfterDate)">{{$t('app.ok')}}</v-btn>
                                </v-date-picker>
                              </v-dialog>
                            </v-flex>
                          </v-layout>

                          <v-flex>
                            <v-checkbox
                              v-model="doNotCallThisNumber"
                              :label="$t('call.dlrDoNotCallThisNumber')"
                            ></v-checkbox>
                          </v-flex>

                          <v-text-field
                            type="text"
                            v-model="callToNumber"
                            :label="$t('call.dlrCallToNumber')"
                          ></v-text-field>
                        </div>

                        <div >
                          <v-select
                            :items="descriptionsAutocomplete"
                            v-model="callResult.name"
                            :item-text="'name'"
                            :label="$t('call.dlrCallResult')"
                            dont-fill-mask-blanks
                          ></v-select>

                          <v-select
                            v-show="callResult && subTextItems.length > 0"
                            v-model="callResult.subText"
                            :items="subTextItems"
                            :label="$t('call.dlrDescription')"
                            combobox
                            clearable
                            dont-fill-mask-blanks
                          ></v-select>
                        </div>

                      </v-card-text>
                    </v-card>

                  </v-expansion-panel-content>

                  <v-expansion-panel-content key="3" v-if="call.postProcessing && call.dbUuid && !call.infoProtectedVariables.dlr_id">
                    <div slot="header">
                      Call details
                    </div>

                    <v-card-text align-content-start>
                      <component :is="option.type" v-for="option in postDataFields" v-model="option.value" v-bind="option.propsData">{{option.text}}</component>
                    </v-card-text>


                  </v-expansion-panel-content>

                </v-expansion-panel>
              </v-card-text>
            </v-layout>
          </v-responsive>

        </v-card>

      </div>
    </v-flex>


    <v-layout row justify-center>
      <v-dialog v-model="errorDialog" max-width="290">
        <v-card>
          <v-card-title class="headline">{{$t('call.errPostProcessTitle')}}</v-card-title>
          <v-card-text>{{errorDialogText}}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" flat="flat" @click="call.destroy()">{{$t('call.closeCall')}}</v-btn>
            <v-btn color="green darken-1" flat="flat" :disabled="call.requestPostProcess" @click="sendPostProcess()">{{$t('call.retryCall')}}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

  </v-layout>

</template>

<script>
    import Countdown from './Countdown'
    import VueMarkdown from 'vue-markdown'
    import copyToClipboard from '../services/clipboard'
    import VueCountdown from '@xkeshi/vue-countdown';

    export default {
      name: "Call",
      components: { Countdown, VueMarkdown, countdownWrap: VueCountdown },
      created() {
        if (!this.call) {
          this.$router.push("/");
        }
      },
      computed: {
        user() {
          return this.$store.getters.user();
        },
        call() {
          return this.$store.getters.getCallByUuid(this.$route.params.id);
        },
        otherCalls() {
          return this.$store.getters.otherCalls(this.$route.params.id);
        },

        postDataFields() {
          return this.call ? this.call.getPostDataFields() : []
        },

        subTextItems() {
          if (this.callResult && this.callResult.name ) {
            const selected = this.call.postProcessDescriptionMetadata.filter(
              item => item.name === this.callResult.name
            )[0];

            if (selected && selected.items ) {
              return selected.items
            }
          }

          return []
        },

        descriptionsAutocomplete() {
          if (!this.call.postProcessDescriptionMetadata) {
            return []
          }
          let key = null;
          if (this.successCall) {
            key = 't';
          } else if (this.nextAfterEnabled) {
            key = 'n';
          } else {
            key = 'f';
          }

          return this.call.postProcessDescriptionMetadata.filter(
            item => item.key === key
          )
        },

        successCall: {
          get() {
            return this.call.getVariable('success')
          },

          set(val) {
            this.call.setPostProcessField('success', !!val)
          }
        },

        callResult: {
          get() {
            return this.call.getVariable('callResult')
          },

          set(val) {
            this.call.setPostProcessField('callResult', val)
          }
        },

        callAfterMin: {
          get() {
            return this.call.getVariable('next_after_sec') / 60
          },

          set(val) {
            this.call.setPostProcessField('next_after_sec', +val * 60)
          }
        },

        doNotCallThisNumber: {
          get() {
            return !!this.call.getVariable('stop_communications')
          },

          set(val) {
            this.call.setPostProcessField('stop_communications', val)
          }
        },

        callToNumber: {
          get() {
            return this.call.getVariable('next_communication')
          },

          set(val) {
            this.call.setPostProcessField('next_communication', val)
          }
        },

        nextAfterEnabled: {
          get() {
            return this.call.getVariable('next_after_enabled')
          },

          set(val) {
            this.call.setPostProcessField('next_after_enabled', val)
          }
        },

        nextAfterTime: {
          get() {
            return this.call.getVariable('next_after_time')
          },

          set(val) {
            this.call.setPostProcessField('next_after_time', val)
          }
        },

        nextAfterDate: {
          get() {
            return this.call.getVariable('next_after_date')
          },

          set(val) {
            this.call.setPostProcessField('next_after_date', val)
          }
        }
      },

      watch: {
        call (call) {
          if (!call) {
            this.$router.push("/");
          }
        }
      },
      data: function() {
        return {
          modalTime: false,
          modalDate: false,
          showTooltipCopy: false,
          showTooltipTimer: null,
          panel: [true, true, true],

          dtmfPanel: false,
          blindTransferNumber: '',
          transferPanel: false,
          errorDialog: false,
          errorDialogText: '',
          anchorAttrs: {
            target: '_blank',
            onclick: `typeof WEBITEL_LINK === 'function' ? WEBITEL_LINK(this, event): null`,
            // onclick: "debugger;",
            rel: 'noopener noreferrer nofollow'
          }
        }
      },
      methods: {
        copyClipboard(data) {
          copyToClipboard(data);

          if (this.showTooltipCopy) {
            return;
          }
          this.showTooltipCopy = true;
          this.showTooltipTimer = setTimeout(() => {
            this.showTooltipCopy = false;
            this.showTooltipTimer = null;
          }, 2000)
        },
        allowedDates: val => new Date(val).getTime() >= new Date(new  Date().toLocaleDateString()).getTime(),
        sendPostProcess() {
          let data = null;
          if (!this.call.infoProtectedVariables.dlr_id && this.postDataFields instanceof Array) {
            data = {};
            for (let item of this.postDataFields) {
              data[item.id] = item.value;
            }
          }
          this.call.sendPostProcess(data, (err, result) => {
            if (err) {
              if (!err.status) {
                this.errorDialogText = `Server shutdown`
              } else {
                this.errorDialogText = (err.body && err.body.info) || 'Internal error';
              }
              this.errorDialog = true;
            }

          })
        }
      },
      destroyed() {
        if (this.showTooltipTimer) {
          clearTimeout(this.showTooltipTimer)
        }
      }
    }
</script>

<style>
  .fix-datetime-picker {
    margin: 14px;
  }
</style>

<style scoped>

  .media {
    height: 100%;
    margin: 0;
  }

  .copy-to-clipboard {
    width: 100%;
    cursor:pointer;
  }

  .custom-loader {
    animation: loader 1s infinite;
    display: flex;
  }
  @-moz-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @-webkit-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @-o-keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes loader {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
