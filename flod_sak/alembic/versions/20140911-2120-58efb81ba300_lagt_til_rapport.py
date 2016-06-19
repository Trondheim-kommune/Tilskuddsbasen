"""lagt til rapport

Revision ID: 58efb81ba300
Revises: 34bd042a40a7
Create Date: 2014-09-11 21:20:33.965374

"""

# revision identifiers, used by Alembic.
revision = '58efb81ba300'
down_revision = '34bd042a40a7'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('arrangement',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('sted', sa.String(), nullable=True),
                    sa.Column('tidspunkt', sa.String(), nullable=True),
                    sa.Column('start_dato', sa.Date(), nullable=True),
                    sa.Column('slutt_dato', sa.Date(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('soknad_vedlagtlink',
                    sa.Column('vedlagtlink_id', sa.Integer(), nullable=False),
                    sa.Column('soknad_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['soknad_id'], ['soknader.id'], ),
                    sa.ForeignKeyConstraint(['vedlagtlink_id'], ['vedlagtlink.id'], ),
                    sa.PrimaryKeyConstraint('vedlagtlink_id', 'soknad_id')
    )
    op.create_table('soknad_vedlegg',
                    sa.Column('vedlegg_id', sa.Integer(), nullable=False),
                    sa.Column('soknad_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['soknad_id'], ['soknader.id'], ),
                    sa.ForeignKeyConstraint(['vedlegg_id'], ['vedlegg.id'], ),
                    sa.PrimaryKeyConstraint('vedlegg_id', 'soknad_id')
    )
    op.create_table('rapport',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('soknad_id', sa.Integer(), nullable=True),
                    sa.Column('prosjekt_gjennomforing', sa.String(length=800), nullable=True),
                    sa.Column('prosjekt_avvik', sa.String(length=300), nullable=True),
                    sa.Column('budsjett_avvik', sa.String(length=300), nullable=True),
                    sa.Column('resultat_kommentar', sa.String(length=300), nullable=True),
                    sa.ForeignKeyConstraint(['soknad_id'], ['soknader.id'], ),
                    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('rapport_vedlegg',
                    sa.Column('vedlegg_id', sa.Integer(), nullable=False),
                    sa.Column('rapport_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['rapport_id'], ['rapport.id'], ),
                    sa.ForeignKeyConstraint(['vedlegg_id'], ['vedlegg.id'], ),
                    sa.PrimaryKeyConstraint('vedlegg_id', 'rapport_id')
    )
    op.create_table('rapport_vedlagtlink',
                    sa.Column('vedlagtlink_id', sa.Integer(), nullable=False),
                    sa.Column('rapport_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['rapport_id'], ['rapport.id'], ),
                    sa.ForeignKeyConstraint(['vedlagtlink_id'], ['vedlagtlink.id'], ),
                    sa.PrimaryKeyConstraint('vedlagtlink_id', 'rapport_id')
    )
    op.create_table('rapport_arrangement',
                    sa.Column('arrangement_id', sa.Integer(), nullable=False),
                    sa.Column('rapport_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['arrangement_id'], ['arrangement.id'], ),
                    sa.ForeignKeyConstraint(['rapport_id'], ['rapport.id'], ),
                    sa.PrimaryKeyConstraint('arrangement_id', 'rapport_id')
    )
    op.add_column(u'soknad_arrangement', sa.Column('arrangement_id', sa.Integer(), nullable=False))
    op.drop_column(u'soknad_arrangement', 'tidspunkt')
    op.drop_column(u'soknad_arrangement', 'slutt_dato')
    op.drop_column(u'soknad_arrangement', 'id')
    op.drop_column(u'soknad_arrangement', 'sted')
    op.drop_column(u'soknad_arrangement', 'start_dato')
    op.alter_column(u'soknad_arrangement', 'soknad_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    op.drop_column(u'vedlagtlink', 'soknad_id')
    op.drop_column(u'vedlegg', 'soknad_id')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column(u'vedlegg', sa.Column('soknad_id', sa.INTEGER(), nullable=True))
    op.add_column(u'vedlagtlink', sa.Column('soknad_id', sa.INTEGER(), nullable=True))
    op.alter_column(u'soknad_arrangement', 'soknad_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    op.add_column(u'soknad_arrangement', sa.Column('start_dato', sa.DATE(), nullable=True))
    op.add_column(u'soknad_arrangement', sa.Column('sted', sa.VARCHAR(length=60), nullable=True))
    op.add_column(u'soknad_arrangement', sa.Column('id', sa.INTEGER(), server_default="nextval('soknad_arrangement_id_seq'::regclass)", nullable=False))
    op.add_column(u'soknad_arrangement', sa.Column('slutt_dato', sa.DATE(), nullable=True))
    op.add_column(u'soknad_arrangement', sa.Column('tidspunkt', sa.VARCHAR(length=60), nullable=True))
    op.drop_column(u'soknad_arrangement', 'arrangement_id')
    op.drop_table('rapport_arrangement')
    op.drop_table('rapport_vedlagtlink')
    op.drop_table('rapport_vedlegg')
    op.drop_table('rapport')
    op.drop_table('soknad_vedlegg')
    op.drop_table('soknad_vedlagtlink')
    op.drop_table('arrangement')
    ### end Alembic commands ###