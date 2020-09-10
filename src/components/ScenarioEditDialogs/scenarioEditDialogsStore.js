
export const scenarioEditDialogs = {
    state: {
        isCopyDialogOpen: false,
        isCreateDialogOpen: false,
        isRenameDialogOpen: false,
        isDeleteDialogOpen: false,
        isOpenScenarioDialogOpen: false,

        scenarioToEdit: null,
        scenarioEditNewName: "",
        isLoading: false,
    },
    mutations: {
        setCopyDialog(state, newVal){
            state.isCopyDialogOpen = newVal
        },
        setCreateDialog(state, newVal){
            state.isCreateDialogOpen = newVal
        },
        setRenameDialog(state, newVal){
            state.isRenameDialogOpen = newVal
        },
        setDeleteDialog(state, newVal){
            state.isDeleteDialogOpen = newVal
        },
        scenarioEditDialogLoadingStart(state){
            state.isLoading = true
        },
        scenarioEditDialogLoadingFinish(state){
            state.isLoading = false
        },
        setOpenScenarioDialog(state, newVal){
            state.isOpenScenarioDialogOpen = newVal
        },


        openCopyDialog(state, scenario){
            state.scenarioToEdit = scenario
            state.scenarioEditNewName = "Copy of " + scenario.saved.name
            state.isCopyDialogOpen = true
        },
        openCreateDialog(state){
            state.scenarioToEdit = null
            state.scenarioEditNewName = "Untitled scenario"
            state.isCreateDialogOpen = true
        },
        openRenameDialog(state, scenario){
            state.scenarioToEdit = scenario
            state.scenarioEditNewName = scenario.saved.name
            state.isRenameDialogOpen = true
        },
        openDeleteDialog(state, scenario){
            state.scenarioToEdit = scenario
            state.isDeleteDialogOpen = true
        },
        openOpenScenarioDialog(state){
            state.scenarioToEdit = null
            state.isOpenScenarioDialogOpen = true
        },

        setScenarioEditNewName(state, newName){
            state.scenarioEditNewName = newName
        },

        setScenarioEditDialogsAllClosed(state){
            state.scenarioToEdit = null
            state.scenarioEditNewName = ""
            state.isDeleteDialogOpen = false
            state.isCopyDialogOpen = false
            state.isCreateDialogOpen = false
            state.isRenameDialogOpen = false
            state.isOpenScenarioDialogOpen = false
        },
    },
    actions: {
    },
    getters: {
        scenarioToEdit: (state) => state.scenarioToEdit,

        isCopyDialogOpen: (state) => state.isCopyDialogOpen,
        isCreateDialogOpen: (state) => state.isCreateDialogOpen,
        isRenameDialogOpen: (state) => state.isRenameDialogOpen,
        isDeleteDialogOpen: (state) => state.isDeleteDialogOpen,
        isOpenScenarioDialogOpen: (state) => state.isOpenScenarioDialogOpen,
        isScenarioEditDialogLoading: (state) => state.isLoading,

        scenarioEditNewName: (state) => state.scenarioEditNewName,


    }
}