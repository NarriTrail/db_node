class ApiFeature{
    constructor(query, queryStr){
        this.query = query;
        this.queryStr = queryStr;
    }
    sort(){
        const userQuery = {...this.queryStr}
        const list= ['sort','limit','page','count']
        const userKeys= Object.keys(userQuery)
        list.forEach((each,ind)=>{
            if (userKeys.includes(each)) {
                delete userQuery[each]
            }
        })
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(',').join(' ');
            this.query= this.query.sort(sortBy)
        }else{
            this.query= this.query.sort('-createdAt')
        }
         this.query=this.query.find(userQuery)
        return this;
    }
    paginate(){
        const limit=3
        // const totalCount=await this.query.countDocuments()
        // const totalPages=Math.ceil(totalCount/limit)
         if (this.queryStr.page) {
            let skip= (this.queryStr.page-1)*limit
            this.query=this.query.skip(skip).limit(limit)
            // if(skip>=totalCount) throw new Error("page not found");
        }
        return this
    }
    limitFields(){
        if (this.queryStr.fields) {
            const fields= this.queryStr.fields.split(',').join(' ')
            console.log(fields,"keys")
            // this.query=this.query.select(fields)
            this.query=this.query.find(this.queryStr).select(fields)
        }
        return this;
    }
}
module.exports = ApiFeature;