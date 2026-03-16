import { Dimensions } from "react-native";

//Device dimensions
const {width: viewportWidth, height: viewportHeight} = Dimensions.get('screen');
export const deviceWidth = viewportWidth;
export const deviceHeight = viewportHeight;

export const serverBaseURL = 'https://api2.finactive.net'
export const serverIMGBaseURL = 'https://phrryt.s3.ap-southeast-2.amazonaws.com/uploads/'
export const GOOGLE_API_KEY = 'AIzaSyD7u-bDQzuzqgRxHkT9fRd6xyMsRmtgLEY'
export const GEOAPIFY_API_KEY = 'AIzaSyBjOyQJKvI37gg2PKY7HJmdJohZbdqYZq4'
export const GOMAPS_API_KEY = 'AIzaSyBjOyQJKvI37gg2PKY7HJmdJohZbdqYZq4'
let sampleHeight = 800;
let sampleWidth = 360;

const scale = viewportWidth / 375;

//Responsive size function
export function moderateScale(size: number) {
  const newSize = size * scale;
  return Math.round(newSize);
}

export const shadowStyle = {
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.5,
  shadowRadius: 4,
  elevation: 5,
}

export const parseImgUri = (uri: any) => {
  // Extract the file name from the URI
  const fileName = uri.split('/').pop();

  // Extract the file extension from the file name
  const fileExtension = fileName.split('.').pop();

  // Determine the type based on the file extension
  let fileType;
  switch (fileExtension.toLowerCase()) {
    case 'jpg':
      fileType = 'image/jpg'
      break;
    case 'jpeg':
      fileType = 'image/jpeg'
      break;
    case 'png':
      fileType = 'image/png'
      break;
    case 'gif':
      fileType = 'image/gif'
      break;
    case 'bmp':
      fileType = 'image/bmp'
      break;
    case 'tiff ':
      fileType = 'image/tiff '
      break;
    case 'tif':
      fileType = 'image/tif'
      break;
    case 'webp':
      fileType = 'image/webp'
      break;
    case 'svg':
      fileType = 'image/svg'
      break;
    // Add more cases for other file types as needed
    default:
      fileType = 'Unknown';
  }

  // Return an object with the type and name
  return {
    type: fileType,
    name: fileName
  };
}

export const GenderType = [
  {label: 'Male', value: 'male'},
  {label: 'Female', value: 'female'},

]

export const ComplainType = [
  {label: 'Vehicle not clean', value: 'vehicle not clean'},
  {label: 'Vehicle not clean', value: 'vehicle not clean'},

]

export const customerCancelRideReasons = [
  { label: "Rider not at the pickup location", value: "Rider not at the pickup location" },
  { label: "Rider unreachable via call or chat", value: "Rider unreachable via call or chat" },
  { label: "Rider wants to go outside serviceable area", value: "Rider wants to go outside serviceable area" },
  { label: "Rider misbehaved or was rude", value: "Rider misbehaved or was rude" },
  { label: "Rider wants to overload the vehicle", value: "Rider wants to overload the vehicle" },
  { label: "Vehicle breakdown", value: "Vehicle breakdown" },
  { label: "Flat tire / puncture", value: "Flat tire / puncture" },
  { label: "Low fuel or fuel emergency", value: "Low fuel or fuel emergency" },
  { label: "Vehicle not starting", value: "Vehicle not starting" },
  { label: "Driver not feeling well", value: "Driver not feeling well" },
  { label: "Driver delayed due to personal emergency", value: "Driver delayed due to personal emergency" },
  { label: "Shift ended / out of working hours", value: "Shift ended / out of working hours" },
  { label: "Heavy traffic at pickup location", value: "Heavy traffic at pickup location" },
  { label: "Weather conditions unsafe for driving", value: "Weather conditions unsafe for driving" },
  { label: "Rider wants to cancel and book again", value: "Rider wants to cancel and book again" },
  { label: "Duplicate booking by rider", value: "Duplicate booking by rider" },
  { label: "Payment mode not acceptable", value: "Payment mode not acceptable" },
  { label: "Other", value: "Other" }
];