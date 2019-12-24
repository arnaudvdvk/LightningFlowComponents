import {LightningElement, api, track, wire} from 'lwc';

import Search from '@salesforce/label/c.Search';
import For from '@salesforce/label/c.For';
import TooManyResultsMessage from '@salesforce/label/c.TooManyResultsMessage';
import NoSearchResultsMessage from '@salesforce/label/c.NoSearchResultsMessage';


export default class addNewMembers extends LightningElement {


    @api singleSelect = false;
    @api name;
    @track existingMembers = [];
    @track searchResults = [];
    @track searchDisabled = false;
    @track isSearchApplied = false;
    @track searchString;
    @track selectedType;
    _customDataStructure;
    _memberTypes;

    @track label = {
        Search,
        TooManyResultsMessage,
        NoSearchResultsMessage,
        For
    };
    settings = {
        selectButton: 'Select'
    };

    @api get customDataStructure() {
        return this._customDataStructure;
    }

    set customDataStructure(value) {
        this._customDataStructure = value;
        if (value) {
            this._memberTypes = Object.keys(value).map(curKey => {
                return {label: curKey, value: curKey}
            });

            if (this._memberTypes && this._memberTypes.length) {
                this.selectedType = this._memberTypes[0].value;
            }
        }
    }

    @api get value() {
        return this.existingMembers;
    }

    set value(value) {
        this.existingMembers = value;
    }

    // connectedCallback() {
    //     debugger;
    // }

    typeChange(event) {
        this.selectedType = event.detail.value;
        this.searchResults = [];
        this.isSearchApplied = false;
    }

    searchEventHandler(event) {
        const searchString = event.detail.value
            .trim()
            .replace(/\*/g)
            .toLowerCase();

        this.isSearchApplied = false;
        this.searchString = searchString;
    }

    listenForEnter(event) {
        if (event.code === 'Enter') {
            this.actuallySearch();
        }
    }

    actuallySearch() {
        if (this._customDataStructure) {
            this.searchDisabled = true;
            let valueFieldName = this._customDataStructure[this.selectedType].valueFieldName;
            let labelFieldName = this._customDataStructure[this.selectedType].labelFieldName;

            this.searchResults = this._customDataStructure[this.selectedType].data.filter(curItem => {
                return curItem[labelFieldName].toLowerCase().includes(this.searchString ? this.searchString.toLowerCase() : '')
            }).map(curItem => {
                return {
                    label: curItem[labelFieldName],
                    value: curItem[valueFieldName],
                    iconName: this.getSelectedIconName(this.existingMembers.includes(curItem[valueFieldName]))
                };
            });

            this.isSearchApplied = true;
            this.searchDisabled = false;
        }
    }

    get isSearchDisabled() {
        return this.searchDisabled || !this.selectedType;
    }

    updateSelected() {
        this.searchResults = this.searchResults.map(curResult => {
            return {...curResult, iconName: this.getSelectedIconName(this.existingMembers.includes(curResult.value))}
        });
    }

    getSelectedIconName(value) {
        return value ? 'utility:check' : ' ';
    }


    get tooManyResults() {
        return this.searchResults.length > 199;
    }

    get columns() {
        return [{
            label: 'Value',
            fieldName: 'value'
        }].concat(this.generateCapabilityColumns(this.settings.selectButton));
    }

    generateCapabilityColumns = (labels) => {
        let labelsArray = labels.replace(/ /g, '').split(',');
        return labelsArray.map(curLabel => {
            return this.getColumnDescriptor(curLabel);
        });
    };

    getColumnDescriptor = (curButtonLabel) => {
        return {
            type: 'button',
            label: curButtonLabel,
            typeAttributes: {
                label: curButtonLabel,
                name: curButtonLabel,
                variant: 'neutral',
                iconName: {fieldName: 'iconName'}
            },
            initialWidth: curButtonLabel.length * 7 + 80
        }
    };


    get isTableVisible() {
        // return true;
        return (this.searchResults && this.searchResults.length > 0);
    }

    get isNoSearchResultsMessageVisible() {
        return (!this.searchDisabled && this.searchResults && this.searchResults.length == 0 && this.isSearchApplied)
    }


    handleRowAction(event) {
        let rowValue = event.detail.row.value;
        if (rowValue && this.singleSelect) {
            if (this.existingMembers.includes(rowValue)) {
                this.existingMembers = [];
            } else {
                this.existingMembers = [rowValue];
            }

        } else {
            if (rowValue && !this.existingMembers.includes(rowValue)) {
                this.existingMembers.push(rowValue);
            } else {
                this.existingMembers = this.existingMembers.filter(curMember => curMember !== rowValue);
            }
        }
        this.dispatchValueChangedEvent();
        this.updateSelected();
    }

    dispatchValueChangedEvent() {
        let returnedValue = this.singleSelect ? (this.existingMembers.length ? this.existingMembers[0] : null) : this.existingMembers;
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                id: this.name,
                newValue: returnedValue,
                newValueDataType: this.selectedType
            }
        });
        this.dispatchEvent(valueChangedEvent);
    }

}
