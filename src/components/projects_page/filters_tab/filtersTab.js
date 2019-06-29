import React, {useState, useEffect, useContext} from "react";

import {createQueryDataForFiltersTab} from 'utils/index';

import {projectFiltersDao} from 'dao/projectFilters.dao';

import InsertFilterForm from "components/projects_page/filters_tab/forms/insertFilterForm";
import PrintFiltersList from "./printFiltersList";
import Pagination from "components/modules/pagination";

import LoadIcon from 'components/svg/loadIcon';

import {AppContext} from 'components/providers/appProvider'

const FiltersTab = function (props) {

    //boolean flag for handling mount status
    let  mounted = true;

    const [filtersList, setFiltersList] = useState([]);

    //filters fetch flag
    const [filtersFetch, setFiltersFetch] = useState(true);

    //total number of fetched results (useful for the pagination component)
    const [totalResults, setTotalResults] = useState(0);

    //get data from global context
    const appConsumer = useContext(AppContext);

    //set query params from url
    const queryData = createQueryDataForFiltersTab(props.location.search);

    useEffect(() => {

        //a wrapper function ask by react hook
        const fetchData = async () => {
            //hide the page
            setFiltersFetch(true);

            //call the dao
            let res = await projectFiltersDao.getFiltersList({"project_id" : props.project_id, ...queryData});

            console.log(res);

            //error checking
            //if the component is still mounted and  is 404 error
            if (mounted && res && res.message === "Not Found") {
                setFiltersList([]);
                setTotalResults(0);
                //show the page
                setFiltersFetch(false);
            }
            //if the component is still mounted and  there are some other errors
            else if (mounted && res && res.message) {
                //pass error object to global context
                appConsumer.setError(res);
            }
            //if the component is still mounted and  res isn't null
            else if (mounted && res) {
                //update state
                setFiltersList(res.results);
                setTotalResults(res.totalResults);
                //show the page
                setFiltersFetch(false);
            }

        };
        fetchData();

        //when the component will unmount
        return () => {
            //set flag as unmounted
            mounted = false;
        };
    }, [queryData.start, queryData.count, queryData.sort, queryData.orderBy]); //re-execute when these variables change

    return (
        <>
            <InsertFilterForm project_id={props.project_id} start={queryData.start} filtersList={filtersList} setFiltersList={setFiltersList}/>
            <div className="left-side-wrapper filters-wrapper">
                {(filtersFetch) ?
                    (
                        <LoadIcon class={"small"}/>
                    ) :
                    (
                        <>
                        <PrintFiltersList filtersList={filtersList} setFiltersList={setFiltersList} project_id={props.project_id}/>
                        <Pagination start={queryData.start} count={queryData.count} totalResults={totalResults} path={props.match.url}/>
                        </>
                    )
                }
            </div>
        </>
    );
}


export default FiltersTab;
