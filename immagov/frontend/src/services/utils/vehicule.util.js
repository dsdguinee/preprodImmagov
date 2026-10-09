import BRANDS from "./cardBrand"
export function getAllModels(){
    return BRANDS
}

export function getAllBrands(){
    //console.log(BRANDS)
    return BRANDS;
}

export function getModelsByBrand(brands){
    // BRANDS.filter(b => b.brand == brands)
    return BRANDS.filter(b => b.brand == brands)[0].models

}

