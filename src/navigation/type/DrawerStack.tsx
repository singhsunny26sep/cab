import { createDrawerNavigator } from '@react-navigation/drawer';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { NavigationString } from '../navigationStrings';
import { StackRoute } from '../navigationRoutes';
import CustomDrawer from '../../components/CustomDrawer/CustomDrawer';
import { moderateScale } from '../../utils/responsiveSize';
import { colors } from '../../constants/colors';
import { useTheme } from '../../constants/ThemeContext';

const Drawer = createDrawerNavigator();

const DrawerStack = () => {
  // init
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { isDarkMode } = useTheme();

  return (
    <Drawer.Navigator drawerContent={props => <CustomDrawer {...props} />} screenOptions={{
      headerShown: false,
      drawerStyle:{
        borderTopRightRadius:moderateScale(3),
        borderBottomRightRadius:moderateScale(3),
        width:250,
        backgroundColor:colors.themePrimary,  
      },
      drawerType:'front'
    }}>
      <Drawer.Screen name={NavigationString.BottomTabStacks} component={StackRoute.BottomTabStack} />
    </Drawer.Navigator>
  );
}

export default DrawerStack;