import "reflect-metadata";


export function log() {
  return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    let originalMethod = descriptor.value; // save a reference to the original method
    console.log("Required is called:", target, propertyKey, descriptor);
    // NOTE: Do not use arrow syntax here. Use a function expression in 
    // order to use the correct value of `this` in this method (see notes below)
    descriptor.value = function (...args: any[]) {
      console.log("The method args are: " + JSON.stringify(args)); // pre
      let result = originalMethod.apply(this, args);               // run and store the result
      console.log("The return value is: " + result);               // post
      return result;                                               // return the result of the original method
    };

    return descriptor;
  }
}

export function collection(name?:string, test?:string):any {
    return function(target:any, propertyKey:string, descriptor:TypedPropertyDescriptor<any>) {
        let collectionName = name || target.name.toLowerCase() + 's';
        target._collectionName = collectionName;
        target.prototype._collectionName = collectionName;

        // setupDocument(target)
    };
}

export function property() {
  return function(target: any, key: string) {
    console.log("Target:", target);
    var t = Reflect.getMetadata("design:type", target, key);
    console.log(`${key} type: ${t && t.name}`);
  }
}