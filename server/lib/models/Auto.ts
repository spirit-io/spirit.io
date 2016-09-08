import { collection } from '../core/decorators';

@collection("Voiture")
export class Automobile {
    marque: String;
    couleur: String;
    model: String;
}