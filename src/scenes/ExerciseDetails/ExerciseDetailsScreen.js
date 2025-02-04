/* @flow */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Paragraph, Caption, Title } from 'react-native-paper';
import { exercises } from 'fithero-exercises';
import memoize from 'lodash/memoize';

import DataProvider from '../../components/DataProvider';
import {
  deleteExercise,
  getExerciseById,
  isCustomExercise,
} from '../../database/services/ExerciseService';
import type { ExerciseSchemaType } from '../../database/types';
import { getExerciseMuscleName, getExerciseName } from '../../utils/exercises';
import i18n from '../../utils/i18n';
import HeaderIconButton from '../../components/HeaderIconButton';
import HeaderOverflowButton from '../../components/HeaderOverflowButton';
import type { NavigationType } from '../../types';
import DeleteWarningDialog from '../../components/DeleteWarningDialog';
import Screen from '../../components/Screen';
import type { AppThemeType } from '../../redux/modules/settings';
import { getDefaultNavigationOptions } from '../../utils/navigation';

const getExercise = memoize(id => exercises.find(e => e.id === id));

type NavigationObjectType = {
  navigation: NavigationType<{
    id: string,
    editAction: () => void,
    deleteAction: (i: number) => void,
  }>,
};

type NavigationOptions = NavigationObjectType & {
  screenProps: {
    theme: AppThemeType,
  },
};

type Props = NavigationObjectType & {};

type State = {
  showDeleteDialog: boolean,
  isDeleting: boolean,
};

class ExerciseDetailsScreen extends React.Component<Props, State> {
  static navigationOptions = ({
    navigation,
    screenProps,
  }: NavigationOptions) => {
    const { params = {} } = navigation.state;

    return {
      ...getDefaultNavigationOptions(screenProps.theme),
      headerRight: isCustomExercise(params.id) ? (
        <View style={styles.toolbarActions}>
          <HeaderIconButton onPress={() => params.editAction()} icon="edit" />
          <HeaderOverflowButton
            onPress={i => params.deleteAction(i)}
            actions={[i18n.t('delete')]}
            destructiveButtonIndex={1}
            last
          />
        </View>
      ) : (
        undefined
      ),
    };
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      showDeleteDialog: false,
      isDeleting: false,
    };

    this.props.navigation.setParams({ editAction: this._editExercise });
    this.props.navigation.setParams({ deleteAction: this._showDeleteWarning });
  }

  _editExercise = () => {
    this.props.navigation.navigate('EditExercise', {
      id: this.props.navigation.state.params.id,
    });
  };

  _showDeleteWarning = (index: number) => {
    if (index === 0) {
      this.setState({ showDeleteDialog: true });
    }
  };

  _hideDeleteWarning = () => {
    this.setState({ showDeleteDialog: false });
  };

  _deleteExercise = () => {
    this.setState({ isDeleting: true }, () => {
      deleteExercise(this.props.navigation.state.params.id);
      this.props.navigation.goBack();
    });
  };

  _renderBody = exercise => (
    <Screen style={styles.screen}>
      <ScrollView>
        <React.Fragment>
          <Title style={styles.section}>
            {getExerciseName(exercise.id, exercise.name)}
          </Title>
          {exercise.notes ? (
            <Paragraph style={styles.section}>{exercise.notes}</Paragraph>
          ) : null}
          <View style={styles.section}>
            <Caption style={styles.smallSubheading}>
              {i18n.t('primary_muscle')}
            </Caption>
            <Paragraph>
              {exercise.primary.map(m => getExerciseMuscleName(m)).join(', ')}
            </Paragraph>
          </View>
          {exercise.secondary.length > 0 && (
            <View style={styles.section}>
              <Caption style={styles.smallSubheading}>
                {i18n.t('secondary_muscle', {
                  count: exercise.secondary.length,
                })}
              </Caption>
              <Paragraph>
                {exercise.secondary
                  .map(m => getExerciseMuscleName(m))
                  .join(', ')}
              </Paragraph>
            </View>
          )}
          <DeleteWarningDialog
            title={i18n.t('delete__exercise_title')}
            description={i18n.t('delete__exercise_description')}
            onConfirm={this._deleteExercise}
            onDismiss={this._hideDeleteWarning}
            visible={this.state.showDeleteDialog}
          />
        </React.Fragment>
      </ScrollView>
    </Screen>
  );

  render() {
    if (this.state.isDeleting) {
      return null;
    }

    const { params = {} } = this.props.navigation.state;
    const id = params.id;
    if (isCustomExercise(id)) {
      return (
        <DataProvider
          query={getExerciseById}
          args={[id]}
          parse={(data: Array<ExerciseSchemaType>) =>
            data.length > 0 ? data[0] : null
          }
          render={(exercise: ?ExerciseSchemaType) =>
            exercise ? this._renderBody(exercise) : null
          }
        />
      );
    }

    return this._renderBody(getExercise(id));
  }
}
const styles = StyleSheet.create({
  toolbarActions: {
    flexDirection: 'row',
  },
  screen: {
    padding: 16,
  },
  section: {
    paddingBottom: 16,
  },
  smallSubheading: {
    fontSize: 14,
  },
});

export default ExerciseDetailsScreen;
