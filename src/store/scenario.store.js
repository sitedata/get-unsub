import _ from 'lodash'
import {api} from "../api.js"
import appConfigs from "../appConfigs"

export const scenario = {
    state: {
        selected: null,
        digest: "",
        configsDigest: "",
        zoomIssnl: null,
        zoomOpen: false,
        tableColsToShow: [
            "usage",
            "free_instant_usage_percent",
            "subscription_cost",
            "ncppu",
            "ncppu_rank",
        ],

        showEditConfig: false,
        configToEdit: null,

    },
    mutations: {
        _setSelectedScenario(state, scenario) {
            state.selected = scenario
            state.digest = Object.values(state.selected.summary).join()
            console.log("store.scenario._setSelectedScenario()", scenario)
        },

        setZoomIssnl: (state, issnl) => {
            state.zoomIssnl = issnl
            state.zoomOpen = true
        },
        closeZoom: (state) => {
            state.zoomIssnl = null
            state.zoomOpen = false
        },

        clearSelectedScenario(state) {
            state.selected = null
            state.digest = ""
        },
        addSubr(state, issnl) {
            if (!state.selected.subrs.includes(issnl)) {
                state.selected.subrs.push(issnl)
            }
        },
        setSubrs(state, subrIssnls) {
            state.selected.subrs = subrIssnls
        },
        removeSubr(state, issnl) {
            state.selected.subrs = state.selected.subrs.filter(j => j !== issnl)
        },
        showTableCol(state, colName) {
            if (!state.tableColsToShow.includes(colName)) {
                state.tableColsToShow.push(colName)
            }
        },
        hideTableCol(state, colName){
            state.tableColsToShow = state.tableColsToShow.filter(c=>c !== colName)
        },
        toggleTableCol(state, colName){
            if (state.tableColsToShow.includes(colName)) {
                // hide it if it's showing
                state.tableColsToShow = state.tableColsToShow.filter(c=>c !== colName)
            }
            else {
                state.tableColsToShow.push(colName)
            }
        },

        showEditConfig(state, configKey){
            if (!state.selected) return

            state.showEditConfig = true
            const configObject = {...appConfigs.scenarioConfigs[configKey]}
            configObject.value = state.selected.configs[configKey]
            state.configToEdit = configObject
        },
        clearEditConfig(state){
            state.showEditConfig = false
            state.configToEdit = null
        },
        setEditConfigValue(state, newVal){
            state.configToEdit.value = newVal
        }



    },
    actions: {
        async fetchScenario({commit, getters}, id) {
            const resp = await api.get("scenario/" + id)
            commit("_setSelectedScenario", resp.data)

            return resp
        },

        async updateSubrs({commit, state}) {
            const url = "scenario/subscriptions/" + state.selected.id;
            await api.post(url, state.selected)
            return
        },

        // this is an Action because we don't want to update the local model
        // optimistically, we want to do *nothing* until it's changed on the
        // server.
        async setConfig({commit, state}, config) {
            const scenario = _.cloneDeep(state.selected)
            scenario.configs[config.k] = config.v

            const url = "scenario/" + state.selected.id;

            const resp = await api.post(url, scenario)
            commit("_setSelectedScenario", resp.data)
            state.configsDigest = Object.values(state.selected.configs).join()
            return resp.data
        },

        // this is an Action because we don't want to update the local model
        // optimistically, we want to do *nothing* until it's changed on the
        // server.
        async saveconfigToEdit({commit, state}) {
            if (!state.configToEdit) return
            console.log("Saving config", state.configToEdit)

            const scenario = _.cloneDeep(state.selected)
            const config = state.configToEdit
            scenario.configs[config.name] = config.value

            const url = "scenario/" + state.selected.id;

            const resp = await api.post(url, scenario)
            commit("_setSelectedScenario", resp.data)
            state.configsDigest = Object.values(state.selected.configs).join()
            return resp.data
        },

        async addSubr({commit, dispatch}, issnl){
            commit("addSubr", issnl)
            await dispatch("updateSubrs")
            return
        },

        async removeSubr({commit, dispatch}, issnl){
            commit("removeSubr", issnl)
            await dispatch("updateSubrs")
            return
        },


    },
    getters: {
        selectedScenario(state) {
            return state.selected
        },
        scenarioDigest: (state) => state.digest,
        summary: (state) => state.selected.summary,
        configsDigest: (state) => state.configsDigest,
        zoomIssnl: (state) => state.zoomIssnl,
        configs(state) {
            return state.selected.configs
        },
        config: (state) => (k) => {
            return state.selected.configs[k]
        },
        configToEdit(state){
            return state.configToEdit


            // if (!(state.selected && state.configToEdit)) {
            //     return false
            // }
            //
            // const configObject = {...appConfigs.scenarioConfigs[state.configToEdit]}
            // configObject.value = state.selected.configs[state.configToEdit]
            // return configObject
        },
        tableColsToShow: (state) => state.tableColsToShow,
    }
}