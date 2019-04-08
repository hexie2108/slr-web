import http from 'src/utils/conn'
import config from 'src/config/index'

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




const paperDao = {
    search,
    "abortRequest" : http.abortRequest
}



export {paperDao};