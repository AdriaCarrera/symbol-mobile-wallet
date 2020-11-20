import React, { Component } from 'react';
import {StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, FlatList} from 'react-native';
import {
	Section,
	GradientBackground,
	AccountBalanceWidget,
	Text,
	PluginList,
	Col,
	Row,
	Icon,
	TitleBar,
	ListItem
} from '@src/components';
import { Router } from '@src/Router';
import { connect } from 'react-redux';
import store from '@src/store';
import ListContainer from "@src/components/backgrounds/ListContainer";
import GlobalStyles from "@src/styles/GlobalStyles";
import translate from "@src/locales/i18n";

const styles = StyleSheet.create({
    transactionPreview: {
        width: '100%',
        height: 60,
        borderRadius: 6,
        marginTop: 4,
        marginBottom: 4,
        padding: 17,
        paddingTop: 8,
        backgroundColor: '#ffff',
	},
	scrollView: {
		flex: 1,
		flexDirection: 'column',
		width: '100%'
	},
	scrollViewContent: {
		flex: 1,
		flexDirection: 'column',
		width: '100%'
	},
	list: {
		marginBottom: 10,
		marginTop: 100,
		flex: 1,
	},
});

type Props = {
    componentId: string,
};

type State = {};

class Home extends Component<Props, State> {
    state = { isSidebarShown: false };

	reload = () => {
        store.dispatchAction({ type: 'account/loadAllData' });
	};

	renderNotification = ({item, index}) => {
		return (
			<ListItem onPress={item.handler ? item.handler : () => {}}>
				<Row justify="space-between">
					<Text type="regular" theme="light">
						{item.title}
					</Text>
					<Text type="regular" theme="light">
						{/* DateTime */}
					</Text>
				</Row>
				<Row justify="space-between">
					<Text type="bold" theme="light">
						{item.description}
					</Text>
				</Row>
			</ListItem>
		);
	}

    render = () => {
        const {
			pendingSignature,
			contentStyle = {},
			componentId,
			accountName,
			onOpenMenu,
			onOpenSettings,
			changeTab,
			isLoading
		} = this.props;
        const {} = this.state;

        const notifications = [];
        notifications.push({ title: translate('home.optInTitle'), description: translate('home.optInDescription' )});
        if (pendingSignature) {
			notifications.push({title: translate('home.pendingSignatureTitle'), description: translate('home.pendingSignatureDescription'), handler: () => changeTab('history')});
		}

        return (
			<GradientBackground
				name="connector_small"
				theme="light"
				fade={true}
				titleBar={<TitleBar theme="light" title={accountName} onOpenMenu={() => onOpenMenu()} onSettings={() => onOpenSettings()}/>}
			>
				<ScrollView
					style={styles.ScrollView}
					contentContainerStyle={styles.scrollViewContent}
					refreshControl={
						<RefreshControl refreshing={isLoading} onRefresh={() => this.reload()} />
					}
				>
					<Col justify="space-between" style={contentStyle}>
						<Section type="list">
							<AccountBalanceWidget />
							<PluginList componentId={componentId} theme="light"/>
						</Section>
					</Col>
					<ListContainer style={styles.list} isScrollable={false}>
						<FlatList
							// style={{ height: '100%' }}
							data={notifications}
							renderItem={this.renderNotification}
						/>
					</ListContainer>
				</ScrollView>
            </GradientBackground>
        );
    }
}

export default connect(state => ({
	isLoading: state.account.loading,
    accountName: state.wallet.selectedAccount.name,
    pendingSignature: state.transaction.pendingSignature,
    address: state.account.selectedAccountAddress,
}))(Home);
