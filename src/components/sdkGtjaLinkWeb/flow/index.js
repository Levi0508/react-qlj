import LinkFlow from './LinkFlow';
import {withFlowContext} from './LinkFlowContext';
import Slot from '../components/Slot';
import actions from './actions';
import components from './components';

LinkFlow.withFlowContext = withFlowContext;
LinkFlow.Slot = Slot;
LinkFlow.actions = actions;
LinkFlow.components = components;

export default LinkFlow;
