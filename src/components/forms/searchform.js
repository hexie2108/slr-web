import React, {useState, useEffect, useContext, useRef} from "react";
import {Link} from 'react-router-dom'
import ClampLines from 'react-clamp-lines';
import queryString from "query-string";


import {paperDao} from 'dao/paper.dao';
import {projectPapersDao} from 'dao/projectPapers.dao'

import CheckBox from "components/forms/checkbox";
import RadioBox from "components/forms/radiobox";
import LoadIcon from 'components/svg/loadIcon';
import SearchButton from 'components/svg/searchButton';
import SearchSimilarButton from 'components/svg/searchSimilarButton';
import {PrintScoupusSearchList} from 'components/papers/printPapersList';
import Select from 'components/forms/select';
import OrderArrow from 'components/svg/orderArrow';
import Pagination from "components/modules/pagination";
import CloseButton from 'components/svg/closeButton';
import RemoveButton from 'components/svg/removeButton';

import {AppContext} from 'components/providers/appProvider'

import {createQueryStringFromObject, getIndexOfObjectArrayByKeyAndValue, arrayOfObjectsContains, join} from 'utils/index';



// Load the lodash build
const _ = require('lodash');

//order options
const orderByOptions = [
    {label: 'Title', value: 'title'},
    {label: 'Date', value: 'date'}
];

//search by  options
const searchByOptions = [
    {label: 'all', value: 'all'},
    {label: 'author', value: 'author'},
    {label: 'content', value: 'content'},
    {label: 'adv. query', value: 'advanced'}
];

//year options
const startYear = 2017;
const endYear = 2020;
//create a int array from startYear to endYear, then convert it to string array, after this concatenate with "all"
const yearOptions = ["all", ...(_.range(startYear, endYear).map(String))];


/**
 * this is component form to search for the paper in project page
 * */

const SearchForm = function ({project_id, location, match, history}) {


    //fetch data
    const [papersList, setPapersList] = useState([]);

    //bool to control the visualization of page
    const [display, setDisplay] = useState(true);

    //bool to show the pagination list
    const [totalResults, setTotalResults] = useState(0);

    //get data from global context
    const appConsumer = useContext(AppContext);


    //set query params from url
    let queryData = createQueryData(location.search);
    //console.log(queryData);

    // list of selected papers
    const [selectedPapersList, setSelectedPapersList] = useState([]);

    //state for search form
    const [keywords, setKeyWords] = useState("_");
    const [source, setSource] = useState({"scopus": true, "googleScholar": false, "arXiv": false});
    const [searchBy, setSearchBy] = useState("all");
    const [year, setYear] = useState("all");

    //state for sorting arrow animation
    const [up, setUp] = useState(queryData.sort);

    useEffect(() => {

        //if the sorting parameter changes I update the status and trigger the SVG animation
        if(up !== queryData.sort){
            setUp(queryData.sort);
            document.getElementById("ani-order-arrow").beginElement();
        }

        //a wrapper function ask by react hook
        const fetchData = async () => {

            //update the values of state from url
            setKeyWords(queryData.query);
            setSource({"scopus": queryData.scopus, "googleScholar": queryData.googleScholar, "arXiv": queryData.arXiv});
            setSearchBy(queryData.searchBy);
            setYear(queryData.year);

            //if there is queryString from URL
            if (queryData.query !== "") {

                setDisplay(false);
                
                //always call the dao to search on scopus
                let res = await paperDao.search(queryData);

                //error checking
                //if is 404 error
                if (res && res.message === "Not Found") {
                    setPapersList([]);
                    setTotalResults(0);
                    //show the page
                    setDisplay(true);
                }
                //if is other error
                else if (res && res.message) {
                    //pass error object to global context
                    appConsumer.setError(res);
                }
                //if res isn't null
                else if (res !== null) {
                    //update state
                    setPapersList(res.results);
                    setTotalResults(res.totalResults);
                    //show the page
                    setDisplay(true);
                }
            }
        };

        fetchData();
        
        //when the component will unmount
        return () => {
            //stop all ongoing request
            paperDao.abortRequest();
        };

    }, [project_id, queryData.query, queryData.orderBy, queryData.searchBy, queryData.sort, queryData.year, queryData.start, queryData.count, queryData.scopus, queryData.googleScholar, queryData.arXiv]);  //re-execute when these variables change





    /*
        START OF 'RESULT PAPERS HANDLING' ########################################################
    */

    //handler for sort selection
    function handleSelection(e) {
        //get index
        let index = parseInt(e.target.getAttribute('data-value'));
        //get value by index
        queryData.orderBy = orderByOptions[index].value;
        //update url
        let queryString = createQueryStringFromObject(queryData);
        history.push(queryString);

    }

    //handler for order selection(ASC|DESC)
    function handelOrder(e) {

        if (queryData.sort === "ASC") {
            queryData.sort = "DESC";
        }
        else {
            queryData.sort = "ASC";
        }
        //update url
        let queryString = createQueryStringFromObject(queryData);
        history.push(queryString);
    }


    /*function to insert and remove the paper id from selected list*/
    function handlePaperSelection(event) {
        let newList;
        //get eid
        let eid = event.target.value;
        //get ttitle
        let title = event.target.name;
        //if id is not included in the list yet
        if (getIndexOfObjectArrayByKeyAndValue(selectedPapersList, "eid", eid) === -1) {
           //create a copy of array
            newList = [...selectedPapersList];
            //insert into array
            newList.push({"eid": eid, "title": title});

        }
        //if id already exists in the list
        else {
            //remove the  target paper from array
            newList = selectedPapersList.filter(function (element) {
                return element.eid !== eid;
            });
        }

        //update array
        setSelectedPapersList(newList);
    }

    /*function to select all papers*/
    function selectAllPapers(event) {
        
        let newList = undefined;
        
        //if not all papers are selected yet
        if(!arrayOfObjectsContains(selectedPapersList, papersList, "eid")){
            //I get the list of the papers in the current page
            let allPapersInPage = papersList.map((paper) => {return {"eid" : paper.eid, "title" : paper.title}});
            //and merge them with the previously selected ones
            let tmpList = [...allPapersInPage, ...selectedPapersList];
            newList = _.uniqBy(tmpList, 'eid');
        }else{//otherwise
            //I get the list of the papers in the current page
            let allPapersInPage = papersList.map((paper) => {return {"eid" : paper.eid, "title" : paper.title}});
            //I filter the selectedPapersList by removing the papers that are in the current page
            newList = selectedPapersList.filter(x => !allPapersInPage.some(paper => paper.eid === x.eid));
        }
        
        setSelectedPapersList(newList);
    }

    /*function to add the post in the project*/
    async function handleAddPapers(event) {

        event.preventDefault();
        //console.log(selectedPapersList);

       //create a eidList from the list of selected paper
        let arrayEid = selectedPapersList.map(element => element.eid);
        //call dao
        let res = await projectPapersDao.postPaperIntoProject({
            "arrayEid": arrayEid, "project_id": project_id
        });
        //if there is the error
        if (res && res.message) {
            //pass error object to global context
            appConsumer.setError(res);
            return null;
        }

        //empties the state
        setSelectedPapersList([]);
        alert("insert completed");

    }

    /*
        END OF 'RESULT PAPERS HANDLING' ########################################################
    */



    /*function to send the query*/
    async function handleSendSearch(event) {

        event.preventDefault();

        //if query input is empty
        if (keywords === "") {
            alert("search string is empty")
        }
        else {
            //synchronize the query data from react state hooks
            queryData.query = keywords;
            queryData.scopus = source.scopus;
            queryData.googleScholar = source.googleScholar;
            queryData.arXiv = source.arXiv;
            queryData.searchBy = searchBy;
            queryData.year = year;

            //send query url
            let queryString = createQueryStringFromObject(queryData);
            //launch to search
            history.push(queryString);

        }

    }

    /**
     *handle to update hook state by input change
     */
    function handleOnInputChange(event) {

        let newSource;

        switch (event.target.name) {
            case "query":
                setKeyWords(event.target.value);
                break;
            case "scopus":
                //copy the old source
                newSource = {...source};
                //switch between true and false
                newSource.scopus = !source.scopus;
                setSource(newSource);
                break;

            case "googleScholar":
                //copy the old source
                newSource = {...source};
                //switch between true and false
                newSource.googleScholar = !source.googleScholar;
                setSource(newSource);
                break;
            case "arXiv":
                //copy the old source
                newSource = {...source};
                //switch between true and false
                newSource.arXiv = !source.arXiv;
                setSource(newSource);
                break;
            case "searchBy":
                setSearchBy(event.target.value);
                break;
            case "year":
                setYear(event.target.value);
                break;
            default:
                break;
        }


    }

    /*
     #######################################
     need to  create a new child component for the part of <form>, when we have more information on search options
     ######################################
     */
    let formPart = (
        <>{}
            <form className={(queryData.query === "") ? 'search-form' : 'search-form small'}
                  onSubmit={handleSendSearch}>
                {/*search form*/}
                <div style={{position: 'relative'}}>
                    <input
                        type="text"
                        placeholder="search"
                        name="query"
                        value={keywords}
                        onChange={handleOnInputChange}
                    />
                   <button className="go-search" type="submit" value="Submit">
                        <SearchButton/>
                    </button>
                    <Link to={"/projects/"+ project_id + "/searchsimilar"}><button className="go-similar" type="button">
                        <SearchSimilarButton/>
                    </button></Link>
                </div>

                <div className="option-holder">
                    <label>Source:</label><br/>

                    <div className="checkboxes-holder">
                        <CheckBox label="Scopus" name="scopus" val="" isChecked={source.scopus}
                                  handler={handleOnInputChange}/>
                        <CheckBox label="Google Scholar" name="googleScholar" val="" isChecked={source.googleScholar}
                                  handler={handleOnInputChange}/>
                        <CheckBox label="arXiv" name="arXiv" val="" isChecked={source.arXiv}
                                  handler={handleOnInputChange}/>
                    </div>

                    <label>Search by:</label><br/>

                    <div className="checkboxes-holder" >
                        <RadioBox label={searchByOptions[0].label} name="searchBy" val={searchByOptions[0].value}
                                  isChecked={searchBy === searchByOptions[0].value} handler={handleOnInputChange}/>
                        <RadioBox label={searchByOptions[1].label} name="searchBy" val={searchByOptions[1].value}
                                  isChecked={searchBy === searchByOptions[1].value} handler={handleOnInputChange}/>
                        <RadioBox label={searchByOptions[2].label} name="searchBy" val={searchByOptions[2].value}
                                  isChecked={searchBy === searchByOptions[2].value} handler={handleOnInputChange}/>
                        <RadioBox label={searchByOptions[3].label} name="searchBy" val={searchByOptions[3].value}
                                  isChecked={searchBy === searchByOptions[3].value} handler={handleOnInputChange}/>
                    </div>

                    <label>Year:</label><br/>
                    <div className="checkboxes-holder" >
                        {
                            yearOptions.map((singleYear, index) =>
                                <RadioBox key={index} label={singleYear} name="year" val={singleYear}
                                          isChecked={year === singleYear} handler={handleOnInputChange}/>
                            )
                        }
                    </div>
                </div>

            </form>
        </>);


    let resultPart = "";

    //if is loading
    if (display === false) {

        resultPart = (
            <div className="paper-card-holder">
                <div className="paper-card-holder-head" style={{pointerEvents: "none"}}>{/* this way the user cannot sort while loading the results */}
                    <div className="select-all">
                    <CheckBox label="Select All" name="select_all" val="" isChecked={false} handler={selectAllPapers}/>
                    </div>
                    <div className="order">
                        <label>sort by:</label>
                        <Select options={orderByOptions}
                                selected={getIndexOfObjectArrayByKeyAndValue(orderByOptions, "value", queryData.orderBy)}
                                handler={handleSelection}/>
                        <button type="button" onClick={handelOrder}><OrderArrow display={true} up={(queryData.sort)}/></button>
                    </div>
                </div>
                <SelectedPapersListBox selectedPapersList={selectedPapersList}/>
                <div className="search-loading-holder">
                    <LoadIcon class={"small"}/>
                </div>
            </div>);
    }

    //if the search results list is empty
    else if (papersList.length === 0 && queryData.query !== "") {
        //the class is used only to workaround a small bug that display not found just as the search start before the loading icon
        resultPart = (
            <div className="not-found"> not found :( </div>
        );
    }
    else if (papersList.length > 0 && queryData.query !== "") {

        //create a eidList from the list of selected paper
        let arrayEid = selectedPapersList.map(element => element.eid);

        resultPart = (
            <div className="paper-card-holder">
                <div className="paper-card-holder-head">
                    <div className="select-all">
                    <CheckBox label="Select All" name="select_all" val="" isChecked={arrayOfObjectsContains(selectedPapersList, papersList, "eid")} handler={selectAllPapers}/>
                    </div>
                    <div className="order">
                        <label>sort by:</label>
                        <Select options={orderByOptions}
                                selected={getIndexOfObjectArrayByKeyAndValue(orderByOptions, "value", queryData.orderBy)}
                                handler={handleSelection}/>
                        <button type="button" onClick={handelOrder}><OrderArrow display={true} up={(queryData.sort)}/></button>
                    </div>
                </div>
                <SelectedPapersListBox selectedPapersList={selectedPapersList} handlePaperSelection={handlePaperSelection}/>

                <PrintScoupusSearchList papersList={papersList} handlePaperSelection={handlePaperSelection} selectedEidList={arrayEid}/>
                <Pagination start={queryData.start} count={queryData.count} totalResults={totalResults} path={match.url}/>
            </div>
        );
    }


    let output = (
        <>
            {formPart}
            <form className="search-results" onSubmit={handleAddPapers}>
                {resultPart}
            </form>
        </>
    );

    return output;
};


/**
 * internal component to print the box of list of selected paper
 */
const SelectedPapersListBox = function ({selectedPapersList, handlePaperSelection}){

    let output = "";
    output = (
        <div className="selected-papers-list" style={{opacity: (selectedPapersList.length>0) ? "1.0" : "0.0", pointerEvents: (selectedPapersList.length>0) ? "auto" : "none"}}>
            <h3>
                {"SELECTED PAPERS"} <br/><span>(total : {selectedPapersList.length})</span>
            </h3>
            <div className="submission-wrapper">
                <div className="papers-wrapper" style={{border: (selectedPapersList.length>0) ? "" : "0px"}}>
                    <div className="papers-flex" style={{padding: (selectedPapersList.length>0) ? "" : "0px"}}>
                        {selectedPapersList.map((element, index) =>
                            <p key={index}>
                                <span>{element.title}</span> 
                                <button type="button" className="remove-btn" name={element.title} value={element.eid} //name and value don't work on the button event for some reasons
                                    onClick={(e) => {handlePaperSelection({target: {name: element.title, value:element.eid}})}}>
                                    <RemoveButton/>
                                </button>
                            </p>
                        )}
                    </div>
                </div>
                <button style={{border: (selectedPapersList.length>0) ? "" : "0px", margin: (selectedPapersList.length>0) ? "" : "0px", height: (selectedPapersList.length>0) ? "" : "0px", pointerEvents: (selectedPapersList.length>0) ? "auto" : "none"}} className="ti-btn add-resultpaper-btn" type="submit" value="Submit">
                    <div className="btn-title">Add Selected Paper</div><div className="btn-icon"> </div>
                </button>
            </div>
        </div>
    );

    return output;

};


/**
 * internal function to prepare a object of queryData
 * @param queryUrl
 * @return object of queryData for the fetch
 */
function createQueryData(queryUrl) {


    //set query params from queryString of url
    let params = queryString.parse(queryUrl);
    let query = params.query || "";

    let searchBy = params.searchBy || "all";
    let orderBy = params.orderBy || "title";
    let sort = params.sort || "ASC";
    let start = params.start || 0;
    let count = params.count || 10;


    let scopus;
    if (params.scopus === undefined) {
        scopus = true;
    }
    else {
        scopus = (params.scopus === "true");
    }

    let googleScholar = (params.googleScholar === "true");
    let arXiv = (params.arXiv === "true");

    let year = params.year || "all";

    let queryData = {query, searchBy, orderBy, sort, scopus, googleScholar, arXiv, year, start, count};

    return queryData;

}


export default SearchForm;