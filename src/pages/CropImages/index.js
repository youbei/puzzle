import './index.scss'
import React from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'

function Index() {
	return (
		<div className="crop-images">
			<Header />
			<Container>
				<div className="crop-images-container">
					<section className="advice">
						<h1 className="advice__title">建设中。</h1>
					</section>
					<section className="city-stuff">
						<ul className="skyscrappers__list">
							<li className="skyscrapper__item skyscrapper-1"></li>
							<li className="skyscrapper__item skyscrapper-2"></li>
							<li className="skyscrapper__item skyscrapper-3"></li>
							<li className="skyscrapper__item skyscrapper-4"></li>
							<li className="skyscrapper__item skyscrapper-5"></li>
						</ul>
						<ul className="tree__container">
							<li className="tree__list">
								<ul className="tree__item tree-1">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>
								<ul className="tree__item tree-2">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>
								<ul className="tree__item tree-3">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
								<ul className="tree__item tree-4">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
								<ul className="tree__item tree-5">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
								<ul className="tree__item tree-6">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
								<ul className="tree__item tree-7">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
								<ul className="tree__item tree-8">
									<li className="tree__trunk"></li>
									<li className="tree__leaves"></li>
								</ul>  
							</li>
						</ul>
						<ul className="crane__list crane-1">
							<li className="crane__item crane-cable crane-cable-1"></li>
							<li className="crane__item crane-cable crane-cable-2"></li>
							<li className="crane__item crane-cable crane-cable-3"></li>
							<li className="crane__item crane-stand"></li>
							<li className="crane__item crane-weight"></li>
							<li className="crane__item crane-cabin"></li>
							<li className="crane__item crane-arm"></li>
						</ul>
						<ul className="crane__list crane-2">
							<li className="crane__item crane-cable crane-cable-1"></li>
							<li className="crane__item crane-cable crane-cable-2"></li>
							<li className="crane__item crane-cable crane-cable-3"></li>
							<li className="crane__item crane-stand"></li>
							<li className="crane__item crane-weight"></li>
							<li className="crane__item crane-cabin"></li>
							<li className="crane__item crane-arm"></li>
						</ul>
						<ul className="crane__list crane-3">
							<li className="crane__item crane-cable crane-cable-1"></li>
							<li className="crane__item crane-cable crane-cable-2"></li>
							<li className="crane__item crane-cable crane-cable-3"></li>
							<li className="crane__item crane-stand"></li>
							<li className="crane__item crane-weight"></li>
							<li className="crane__item crane-cabin"></li>
							<li className="crane__item crane-arm"></li>
						</ul>
					</section>
				</div>
			</Container>
		</div>
	)
}

export default Index
