import axios from "axios";
import Vue from "vue"

import {api} from "../api"
import {
    fetchScenario,
    newScenario,
    createScenario,
    copyScenario,
    saveScenario,
    deleteScenario,
} from "../shared/scenario";
import {makePublisherJournal} from "../shared/publisher";
import _ from "lodash";
import appConfigs from "../appConfigs";
import publisherFileConfigs from "../components/PublisherFile/publisherFileConfigs";
import {publisherLogoFromId} from "../shared/publisher";

// https://www.npmjs.com/package/short-uuid
const short = require('short-uuid');


export const publisher = {
    state: {
        selected: null,

        isLoading: false,
        apcIsLoading: false,

        id: null,
        publisher: "",
        name: "",
        isDemo: false,
        scenarios: [],
        journalDetail: {},
        journalCounts: {
            analyzed: 0,
            missingPrices: 0,
            oa: 0,
            leftOrStopped: 0
        },
        journals: [],
        dataFiles: [],
        counterIsUploaded: false,
        bigDealCost: 0,
        isOwnedByConsortium: false,

        // apc stuff
        apcHeaders: [],
        apcJournals: [],
        apcPapersCount: null,
        apcAuthorsFractionalCount: null,
        apcCost: null,


    },
    mutations: {
        clearPublisher(state) {
            state.isLoading = false
            state.id = null
            state.publisher = ""
            state.name = ""
            state.isDemo = false
            state.scenarios = []
            state.journalDetail = {}
            state.journalCounts = {
                analyzed: 0,
                missingPrices: 0,
                oa: 0,
                leftOrStopped: 0
            }
            state.journals = []
            state.dataFiles = []
            state.counterIsUploaded = false
            state.bigDealCost = 0

            state.apcHeaders = []
            state.apcJournals = []
            state.apcPapersCount = null
            state.apcAuthorsFractionalCount = null
            state.apcCost = null
            state.isOwnedByConsortium = false
        },
        clearApcData(state) {
            state.apcHeaders = []
            state.apcJournals = []
            state.apcPapersCount = null
            state.apcAuthorsFractionalCount = null
            state.apcCost = null
        },

        setSelectedPublisher(state, apiPublisher) {
            state.selected = apiPublisher // legacy

            state.id = apiPublisher.id
            state.publisher = apiPublisher.publisher
            state.name = apiPublisher.name
            state.isDemo = apiPublisher.is_demo
            state.scenarios = apiPublisher.scenarios
            state.journalDetail = apiPublisher.journal_detail
            state.journalCounts = {
                analyzed: apiPublisher.journal_detail.counts.in_scenario,
                missingPrices: apiPublisher.journal_detail.diff_counts.diff_no_price,
                oa: apiPublisher.journal_detail.diff_counts.diff_open_access_journals,
                leftOrStopped: apiPublisher.journal_detail.diff_counts.diff_not_published_in_2019 + apiPublisher.journal_detail.diff_counts.diff_changed_publisher
            }
            state.journals = []
            state.journals = apiPublisher.journals.map(j => {
                return makePublisherJournal(j)
            })
            state.dataFiles = apiPublisher.data_files.map(dataFile => {
                dataFile.name = dataFile.name.replace("prices", "price")
                return dataFile
            })
            state.counterIsUploaded = state.dataFiles.findIndex(f => f.name === 'counter' && f.uploaded) > -1
            state.bigDealCost = apiPublisher.cost_bigdeal
            state.isOwnedByConsortium = apiPublisher.is_owned_by_consortium
        },
        clearSelectedPublisher(state) {
            state.selected = null
        },
        startLoading(state) {
            state.isLoading = true
        },
        finishLoading(state) {
            state.isLoading = false
        },
        replaceScenario(state, newScenario) {
            const index = state.scenarios.findIndex(s => s.id === newScenario.id)
            state.scenarios.splice(index, 1, newScenario)
        },

        deleteScenario(state, id) {
            const index = state.scenarios.findIndex(s => s.id === newScenario.id)
            state.scenarios.splice(index, 1)
        },


    },
    actions: {
        async fetchPublisher({commit, dispatch, getters}, id) {
            if (id == getters.publisherId) return
            commit("startLoading")
            await dispatch("fetchPublisherMainData", id)
            commit("finishLoading")
            return
        },
        async refreshPublisher({commit, dispatch, getters}) {
            commit("startLoading")
            await dispatch("fetchPublisherMainData", getters.publisherId)
            commit("finishLoading")
            return
        },


        async fetchPublisherMainData({commit, dispatch, getters}, id) {
            const url = `publisher/${id}`
            const resp = await api.get(url)
            const pubData = resp.data

            console.log("got publisher back. hydrating scenarios")
            const myScenarioPromises = pubData.scenarios.map(apiScenario => {
                return fetchScenario(apiScenario.id)
            });
            pubData.scenarios = await Promise.all(myScenarioPromises)
            console.log("done hydrating all the scenarios")

            commit("setSelectedPublisher", pubData)
            return resp
        },

        async fetchPublisherApcData({commit, state, dispatch, getters}, id) {
            state.apcIsLoading = true

            const url = `publisher/${id}/apc`

            let resp
            try {
                resp = await api.get(url)
            } catch (e) {
                console.log("error loading publisher APC", e.response)
                resp = null
            } finally {
                state.apcIsLoading = false
            }

            if (resp) {
                state.apcPapersCount = resp.data.headers.find(h => h.value === "num_apc_papers").raw
                state.apcAuthorsFractionalCount = resp.data.headers.find(h => h.value === "fractional_authorship").raw
                state.apcCost = resp.data.headers.find(h => h.value === "cost_apc").raw
                state.apcHeaders = resp.data.headers
                state.apcJournals = resp.data.journals
                return resp
            }
            return

        },

        async refreshPublisherScenario({dispatch, commit}, scenarioId){
            const newScenario = await fetchScenario(scenarioId)
            commit("replaceScenario", newScenario)
        },


        async renameScenario({commit, dispatch, getters}, {id, newName}) {
            const payload = _.cloneDeep(getters.publisherScenario(id).saved)
            payload.name = newName
            await api.post(`scenario/${id}`, payload) // set it on the server
            await dispatch("refreshPublisherScenario", id) // ask for the new, renamed scenario
        },
        async createScenario({state, getters}, {name}) {
            const newScenario = await createScenario(getters.publisherId, name)
            state.scenarios.push(newScenario)
            return newScenario
        },
        async copyScenario({commit, getters, state}, {id, newName}) {
            const newScenario = await copyScenario(getters.publisherId, id, newName)
            state.scenarios.push(newScenario)
            return newScenario
        },
    },
    getters: {
        selectedPublisher(state) {
            return state.selected
        },
        publisherName: (state) => {
            return state.name
        },
        publisherLogo: (state) => {
            return publisherLogoFromId(state.publisher)
        },

        publisherId: (state) => state.id,
        publisherPublisher: (state) => state.publisher,
        publisherJournalCounts: (state) => state.journalCounts,
        publisherJournals: (state) => state.journals,
        publisherJournalsValid: (state) => state.journals.filter(j => j.isValid),
        publisherScenariosCount: (state) => state.scenarios.length,
        publisherScenario: (state) => (id) => {
            return state.scenarios.find(s => s.id === id)
        },
        publisherScenarioIndex: (state) => (id) => {
            return state.scenarios.findIndex(s => s.id === id)
        },
        publisherScenariosAreAllLoaded: (state) => {
            return state.scenarios.filter(s => s.isLoading).length === 0
        },
        getScenarios: (state) => state.scenarios,
        publisherScenarios: (state) => state.scenarios,
        isPublisherDemo: (state) => state.isDemo,
        publisherBigDealCost: (state) => state.bigDealCost,
        publisherIsLoading: (state) => state.isLoading,

        publisherFilesDict: (state) => {
            const ret = {}
            state.dataFiles.forEach(f => {
                const val = {
                    ...f,
                    id: _.camelCase(f.name),
                }
                ret[val.id] = val
            })
            return ret
        },

        publisherFiles: (state) => {
            return state.dataFiles.map(f => {

                const ret = {
                    ...f,
                    id: _.camelCase(f.name),
                }

                // if (f.error_rows) {
                //     ret.error_rows = {
                //         headers: [{name: "Row Number", id: "rowNo"}].concat(f.error_rows.headers),
                //         rows: f.error_rows.rows.map(row => {
                //             row.cells.rowNo = {value: row.row_no}
                //             return row
                //         })
                //     }
                // }


                return ret
            })
        },


        publisherCounterIsUploaded: (state) => state.counterIsUploaded,
        publisherIsOwnedByConsortium: (state) => state.isOwnedByConsortium,


        // apc stuff
        publisherApcIsLoading: (state) => state.apcIsLoading,
        publisherApcPapersCount: (state) => state.apcPapersCount,
        publisherApcAuthorsFractionalCount: (state) => state.apcAuthorsFractionalCount,
        publisherApcCost: (state) => state.apcCost,
        publisherApcJournals: (state) => state.apcJournals,
        publisherApcHeaders: (state) => state.apcHeaders,
    }
}