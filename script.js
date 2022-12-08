'use strict';

// prettier-ignore





//Workout Class
class Workout{

    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords,distance,duration){
        this.coords = coords;     // [lat, lng]
        this.distance = distance; //in km
        this.duration = duration; //in min             
    }

    _setDescription(){
        //prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${ months[this.date.getMonth()] } ${this.date.getDate()} `;
    }

    click(){
        this.clicks++;
    } 

}

class Running extends Workout{
    type = 'running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence =  cadence;
        this.calPace();
        this._setDescription();
    }

    calPace(){
       // min/km
       this.pace = this.duration / this.distance;
       return this.pace; 
    }

}

class Cycling extends Workout{
   type = 'cycling';

    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain =  elevationGain;
        this.calSpeed();
        this._setDescription();
    }
    
    calSpeed(){
        // km/hour
        this.speed = this.distance / (this.duration / 60) ;
        return this.speed; 
     }
}


// const run1 = new Running([39,-12], 5.2, 24, 178)
// const cycling1 = new Cycling([39,-12], 27, 95, 523)
// console.log(run1, cycling1)

//////////////////////////////////////////////////////////////
//Application Architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


//App class
class App{

    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];

    constructor(){
      
        this._getPosition();

        form.addEventListener('submit',this._newWorkout.bind(this));

        inputType.addEventListener('change',this._toggleElevationField);

        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this))
    }

    _getPosition(){
        
          
          const errorCallback = (error) => {
            console.log(error);
          };
          
          if(navigator.geolocation){
              navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), errorCallback);
          }
        
    }

    _loadMap(position){

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            console.log(`https://www.google.com/maps/@${latitude},${longitude}`)
        
            //define custom coords array
        
            const coords = [latitude,longitude];    
        
        
             this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        
            // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(this.#map);
        
        
           //Handling click on  Map
            this.#map.on('click',this._showForm.bind(this))
        

    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');   
        inputDistance.focus();
    }

    _hideForm(){
        //Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '' ;
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display='grid',1000)   

    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');  
    }

    _newWorkout(e){
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        

        const allPositive = (...inputs) =>
            inputs.every(inp => inp > 0);
        

        e.preventDefault();

        //Get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value ;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //If workout running, then create running object
        if(type === 'running'){
            const  cadence = +inputCadence.value;
            //check if data if valid 
            if(
                !validInputs(distance,duration,cadence) ||
                !allPositive(distance,duration,cadence)
             )
            return alert('runningInputs have to be positive number');
            workout = new Running([lat, lng],distance, duration, cadence);
            
        }
        //If workout cycling, then create cycling object
        if(type === 'cycling'){
            const elevation  =  +inputElevation.value;
            //check if data if valid 
             if(!validInputs(distance,duration,elevation)  || 
             !allPositive(distance,duration) )
            return alert('Inputs have to be positive number'); 
            workout = new Cycling([lat, lng],distance, duration, elevation);
        }

        //Add new object to workout array
        this.#workouts.push(workout);
        console.log(workout)
        
        //Render workout on map as marker
        this._renderWorkoutMarker(workout);

        //Render workour on list
        this._renderWorkout(workout);


        //Hidden workout on list

        //Hide form and clear input fields
        this._hideForm();


    }

    _renderWorkoutMarker(workout){

        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            
        }))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`)  
        .openPopup();
    }

    _renderWorkout(workout){
      let html = `
         <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            

      `;  

      if(workout.type === 'running'){

        html += `   
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
                </li>

                `;

      }
      if(workout.type === 'cycling'){

        html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>
            
        `;

      }

      form.insertAdjacentHTML('afterend',html);

    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);


        if(!workoutEl) return;

        const workout = this.#workouts.find( work => work.id === workoutEl.dataset.id );

        // console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration:1,
            }
        })

        console.log(workout);

        //using the public interface
        workout.click(); 


    }
}



//create a objet

const app = new App();

//test



 


  //For input change from running to cycling

