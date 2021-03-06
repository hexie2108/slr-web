import http from 'utils/conn'
import config from 'config/index'

/**
 * dao to search local papers
 * @param queryData
 * @return {array[objects]}
 */
async function search(queryData){
    let url = config.home+config.search;

        const res = await http.get(url, queryData);
        return res;

}

/**
 * get a specific paper
 */
async function selectById(id){
    let url = config.home + config.papers + "/" + id;

    const res = await http.get(url);
    return res;
}

/**
 * dao to search similar papers
 * @param bodyData
 * @return {array[objects]}
 */
async function searchSimilar(bodyData){
    let url = config.home+config.search_similar;

    const res = await http.post(url, bodyData);

    
    return res;

}

/**
 * dao to automated search
 * @param bodyData
 * @return {array[objects]}
 */
async function searchAutomated(bodyData){
    let url = config.home+config.search_automated;

    const res = await http.post(url, bodyData);

    
    return res;

}

const paperDao = {
    search,
    selectById,
    searchSimilar,
    searchAutomated,
    "abortRequest" : http.abortRequest
}



export {paperDao};